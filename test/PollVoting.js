const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const bytesToString = (bytes) => {
  return ethers.utils.parseBytes32String(bytes);
};

const stringToBytes = (str) => {
  return ethers.utils.formatBytes32String(str);
};

describe("PollVoting", () => {
  let accounts, contract;
  const title = stringToBytes("PM of India?");
  const options = [
    stringToBytes("rahul"),
    stringToBytes("modi"),
    stringToBytes("yash"),
  ];

  before(async () => {
    accounts = await ethers.getSigners();
    const PollsVoting = await ethers.getContractFactory("PollVoting");
    contract = await PollsVoting.deploy();
  });

  describe("Creating poll", () => {
    it("should revert while creating a poll with empty title", async () => {
      const emptyTitle = stringToBytes("");
      await expect(contract.addPoll(emptyTitle, options, 500))
        .to.revertedWithCustomError(contract, "InvalidTitle")
        .withArgs(emptyTitle);
    });
    it("should revert while creating a poll with wrong no. of options", async () => {
      await expect(contract.addPoll(title, [], 500))
        .to.revertedWithCustomError(contract, "InvalidOptionLength")
        .withArgs(0);
      await expect(contract.addPoll(title, [options[0]], 500))
        .to.revertedWithCustomError(contract, "InvalidOptionLength")
        .withArgs(1);
      await expect(
        contract.addPoll(
          title,
          [...options, stringToBytes("mehul"), stringToBytes("abhishek")],
          500
        )
      )
        .to.revertedWithCustomError(contract, "InvalidOptionLength")
        .withArgs(5);
    });
    it("should revert while creating a poll with less than 10 seconds exp time", async () => {
      await expect(contract.addPoll(title, options, 5))
        .to.revertedWithCustomError(contract, "InvalidTime")
        .withArgs(5);
    });
    it("should successfully create a poll and emit an event", async () => {
      await expect(contract.addPoll(title, options, 500))
        .to.emit(contract, "PollCreated")
        .withArgs(title, 3, 500);
    });
  });

  describe("Casting votes and getting poll details", () => {
    it("should not let one person vote again", async () => {
      await contract.connect(accounts[1]).castAVote(accounts[0].address, 0, 0);
      await expect(
        contract.connect(accounts[1]).castAVote(accounts[0].address, 0, 0)
      )
        .to.revertedWithCustomError(contract, "DuplicateVoteError")
        .withArgs(accounts[1].address);
    });
    it("should cast 3,5,2 votes to rahul, modi, and yash respectively", async () => {
      // Voting 2 times for Rahul
      await contract.connect(accounts[2]).castAVote(accounts[0].address, 0, 0);
      await contract.connect(accounts[3]).castAVote(accounts[0].address, 0, 0);
      // Voting 5 times for Modi
      await contract.connect(accounts[4]).castAVote(accounts[0].address, 0, 1);
      await contract.connect(accounts[5]).castAVote(accounts[0].address, 0, 1);
      await contract.connect(accounts[6]).castAVote(accounts[0].address, 0, 1);
      await contract.connect(accounts[7]).castAVote(accounts[0].address, 0, 1);
      await contract.connect(accounts[8]).castAVote(accounts[0].address, 0, 1);
      // Voting 2 times fro Yash
      await contract.connect(accounts[9]).castAVote(accounts[0].address, 0, 2);
      await contract.connect(accounts[10]).castAVote(accounts[0].address, 0, 2);
    });
    it("should get the poll details correctly", async () => {
      const poll = await contract.getPollDetails(accounts[0].address, 0);
      // console.log(poll);
      expect(poll.votes[0]).to.equal(3);
      expect(poll.votes[1]).to.equal(5);
      expect(poll.votes[2]).to.equal(2);
    });
    it("should get the winner correctly after the poll expires", async () => {
      time.increaseTo((await time.latest()) + 500);
      const poll = await contract.getPollDetails(accounts[0].address, 0);
      expect(poll.winner).to.equal(stringToBytes("modi"));
      console.log("Winner: ", bytesToString(poll.winner));
    });
  });
});
