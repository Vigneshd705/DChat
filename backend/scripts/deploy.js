// scripts/deploy.js

const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Get the contract factory
  const ChatApp = await hre.ethers.getContractFactory("ChatApp");

  // Deploy the contract
  const chatApp = await ChatApp.deploy();

  // Wait for the deployment to be confirmed
  await chatApp.waitForDeployment();

  // Get the deployed contract address
  const contractAddress = await chatApp.getAddress();
  console.log("ChatApp deployed to:", contractAddress);

  // --- Storing the contract data for frontend ---
  
  // Get the contract artifact
  const contractArtifact = hre.artifacts.readArtifactSync("ChatApp");

  // Create a directory for frontend data if it doesn't exist
  if (!fs.existsSync("./frontend")) {
    fs.mkdirSync("./frontend");
  }

  // Write the contract address and ABI to a JSON file
  fs.writeFileSync(
    "./frontend/contract-data.json",
    JSON.stringify({ 
      address: contractAddress, 
      abi: contractArtifact.abi 
    }, null, 2)
  );

  console.log("Contract address and ABI saved to ./frontend/contract-data.json");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
