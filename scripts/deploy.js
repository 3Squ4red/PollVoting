async function main() {
  const PollVoting = await hre.ethers.getContractFactory("PollVoting");
  const pollVoting = await PollVoting.deploy();

  await pollVoting.deployed();

  console.log(
    `PollVoting deployed to ${pollVoting.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
