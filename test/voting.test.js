const VC = artifacts.require('Voting');
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('Voting', function(accounts){
    //voter 1 is the owner
    const voter1 = accounts[0];
    const voter2 = accounts[1];
    const voter3 = accounts[2];
    const voter4 = accounts[3];    
    const voter5 = accounts[4];
    const voter6 = accounts[5];
    const voter7 = accounts[6];
    const voter8 = accounts[7];
    const voter9 = accounts[8];

    beforeEach(async function(){
        this.instance = await VC.new({from:voter1});
    });

    describe("#OpenZeppelin ownable", async function(){
        it(' check if owner is the voter1', async function(){
            const contractOwner = await this.instance.owner.call();
            expect(contractOwner).to.be.equal(voter1);
        });
        it('check if modifier onlyOwner revert if annother voter call an onlyOwner function', async function(){
            await expectRevert(this.instance.renounceOwnership.call({from:voter2}), "Ownable: caller is not the owner");
        });
    });

    describe("#addVoter", async function(){
        it('check if add a voter works fine', async function(){
            await this.instance.addVoter(voter1, {from:voter1});
            const voter = await this.instance.getVoter.call(voter1, {from:voter1});
            expect(voter.isRegistered).to.be.ok;
            expect(voter.hasVoted).to.be.false;
            expect(voter.votedProposalId).to.be.bignumber.equal(new BN(0));
        });
        it('check revert if registration is not open yet', async function(){
            await this.instance.startProposalsRegistering({from:voter1});
            await expectRevert(this.instance.addVoter(voter2, {from:voter1}), "Voters registration is not open yet");
        });
        it('check revert if owner try to register a voter already registered', async function(){
            await this.instance.addVoter(voter2, {from:voter1});
            await expectRevert(this.instance.addVoter(voter2, {from:voter1}), "Already registered");
        });
        it('check if emit an event if owner register a voter', async function(){
            const event = await this.instance.addVoter(voter2, {from:voter1});
            expectEvent(event, "VoterRegistered",{voterAddress:voter2});
        });
    });

    describe('#startProposalRegistering', async function(){
        it('check revert if current status isnt registeringVoters', async function(){
            await this.instance.startProposalsRegistering({from:voter1});
            await expectRevert(this.instance.startProposalsRegistering({from:voter1}), "Registering proposals cant be started now");
        });
        it('check change workflowStatus to ProposalsRegistrationStarted', async function(){
            await this.instance.startProposalsRegistering({from:voter1});
            const status = await this.instance.workflowStatus.call();
            expect(new BN(status)).to.be.bignumber.equal(new BN(1));
        });
        it('check emit WorkflowStatusChange event', async function(){
            const event = await this.instance.startProposalsRegistering({from:voter1});
            expectEvent(event, "WorkflowStatusChange",{previousStatus:new BN(0), newStatus:new BN(1)});
        });
    });

    describe('#addProposal', async function(){
        beforeEach(async function(){
            await this.instance.addVoter(voter1,{from:voter1});
            await this.instance.startProposalsRegistering({from:voter1});
        });
        it('check add a proposal', async function(){
            await this.instance.addProposal('random proposal', {from:voter1});
            const proposal = await this.instance.getOneProposal.call(0, {from:voter1});
            expect(proposal.description).to.be.equal('random proposal');
            expect(proposal.voteCount).to.be.bignumber.equal(new BN(0));
        });
        it('check revert if current status is not correct', async function(){
            await this.instance.endProposalsRegistering({from:voter1});
            await expectRevert(this.instance.addProposal('random proposal', {from:voter1}), "Proposals are not allowed yet");
        });
        it('check emit a ProposalRegistered event', async function(){
            const event = await this.instance.addProposal('random proposal', {from:voter1});
            expectEvent(event, "ProposalRegistered", {proposalId:new BN(0)});
        });
    });

    describe("#endProposalsRegistering", async function(){
        beforeEach(async function(){
            await this.instance.startProposalsRegistering({from:voter1});
        });
        it('check revert if current status is not correct', async function(){
            this.instance.endProposalsRegistering({from:voter1});
            await expectRevert(this.instance.endProposalsRegistering({from:voter1}), "Registering proposals havent started yet");
        });
        it('check change workflowStatus to ProposalsRegistrationEnded', async function(){
            await this.instance.endProposalsRegistering({from:voter1});
            const status = await this.instance.workflowStatus.call();
            expect(new BN(status)).to.be.bignumber.equal(new BN(2));
        });
        it('check emit WorkflowStatusChange event', async function(){
            const event = await this.instance.endProposalsRegistering({from:voter1});
            expectEvent(event, "WorkflowStatusChange",{previousStatus:new BN(1), newStatus:new BN(2)});
        });
    });

    describe("#startVotingSession", async function(){
        beforeEach(async function(){
            await this.instance.startProposalsRegistering({from:voter1});
            await this.instance.endProposalsRegistering({from:voter1});
        });
        it('check revert if current status is not correct', async function(){
            await this.instance.startVotingSession({from:voter1});
            await expectRevert(this.instance.startVotingSession({from:voter1}), "Registering proposals phase is not finished");
        });
        it('check change workflowStatus to VotingSessionStarted', async function(){
            await this.instance.startVotingSession({from:voter1});
            const status = await this.instance.workflowStatus.call();
            expect(new BN(status)).to.be.bignumber.equal(new BN(3));
        });
        it('check emit WorkflowStatusChange event', async function(){
            const event = await this.instance.startVotingSession({from:voter1});
            expectEvent(event, "WorkflowStatusChange",{previousStatus:new BN(2), newStatus:new BN(3)});
        });
    });

    describe("#setVote", async function(){
        beforeEach(async function(){
            await this.instance.addVoter(voter1, {from:voter1});
            await this.instance.addVoter(voter2, {from:voter1});
            await this.instance.startProposalsRegistering({from:voter1});
            await this.instance.addProposal('random proposal', {from:voter1});
            await this.instance.endProposalsRegistering({from:voter1});
        });
        it('check revert if voting session hasnt started', async function(){
            await expectRevert(this.instance.setVote.call(0, {from:voter1}), "Voting session havent started yet");
        });
        it('check revert if a voter has alredy voted', async function(){
            await this.instance.startVotingSession({from:voter1});
            await this.instance.setVote(0, {from:voter2});
            await expectRevert(this.instance.setVote(1, {from:voter2}), "You have already voted");
        });
        it('check revert if voter vote for a proposal that does not exist', async function(){
            await this.instance.startVotingSession({from:voter1}); 
            await expectRevert(this.instance.setVote(10, {from:voter1}), "Proposal not found");
        });
        it('check emit an Voted event', async function(){
            await this.instance.startVotingSession({from:voter1});
            const event = await this.instance.setVote(0, {from:voter1});
            expectEvent(event, "Voted", {voter:voter1, proposalId:new BN(0)});
        });
    });

    describe("#endVotingSession", async function(){
        beforeEach(async function(){
            await this.instance.startProposalsRegistering({from:voter1});
            await this.instance.endProposalsRegistering({from:voter1});
            await this.instance.startVotingSession({from:voter1});
        });
        it('check revert if current status is not correct', async function(){
            await this.instance.endVotingSession({from:voter1});
            await expectRevert(this.instance.endVotingSession({from:voter1}), "Voting session havent started yet");
        });
        it('check change workflowStatus to VotingSessionEnded', async function(){
            await this.instance.endVotingSession({from:voter1});
            const status = await this.instance.workflowStatus.call();
            expect(new BN(status)).to.be.bignumber.equal(new BN(4));
        });
        it('check emit WorkflowStatusChange event', async function(){
            const event = await this.instance.endVotingSession({from:voter1});
            expectEvent(event, "WorkflowStatusChange",{previousStatus:new BN(3), newStatus:new BN(4)});
        });
    });

    describe("#tallyVotes", async function(){
        beforeEach(async function(){
            for (let i = 0; i < 9; i++) {
                await this.instance.addVoter( accounts[i], {from:voter1});  
            }
            await this.instance.startProposalsRegistering({from:voter1});
            await this.instance.addProposal('red');
            await this.instance.addProposal('blue');
            await this.instance.addProposal('green');
            await this.instance.endProposalsRegistering({from:voter1});
            await this.instance.startVotingSession({from:voter1});
            await this.instance.setVote(new BN(0), {from:voter1});
            await this.instance.setVote(new BN(1), {from:voter2});
            await this.instance.setVote(new BN(1), {from:voter3});
            await this.instance.setVote(new BN(2), {from:voter4});
            await this.instance.setVote(new BN(2), {from:voter5});
            await this.instance.setVote(new BN(2), {from:voter6});

        });
        it('check revert if current status is not correct', async function(){
            await expectRevert(this.instance.tallyVotes.call({from:voter1}), "Current status is not voting session ended");
        });
        it('check having the winner in winningProposalId', async function(){
            await this.instance.endVotingSession({from:voter1});
            await this.instance.tallyVotes({from:voter1});
            const winner = await this.instance.winningProposalID.call({from:voter1});
            expect(new BN(winner)).to.be.bignumber.equal(new BN(2));
        });
        it('check emit a WorkflowStatusChange', async function(){
            await this.instance.endVotingSession({from:voter1});
            const event = await this.instance.tallyVotes({from:voter1});
            expectEvent(event, "WorkflowStatusChange", {previousStatus:new BN(4), newStatus:new BN(5)});
        });
    });
});
