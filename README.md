# DChat - A Decentralized Chat Application

DChat is a fully decentralized real-time chat application built on the Ethereum blockchain. It leverages smart contracts for user identity and friend management, with messages being transmitted via blockchain events to ensure privacy and decentralization. This project serves as a proof-of-concept for building censorship-resistant communication platforms.

---

## 📜 Table of Contents

-   [Key Features](#-key-features)
-   [Technology Stack](#-technology-stack)
-   [Getting Started](#-getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Backend Setup (Hardhat)](#1-backend-setup-hardhat)
    -   [Frontend Setup (React)](#2-frontend-setup-react)
-   [Usage Workflow](#-usage-workflow)

---

## ✨ Key Features

-   **Wallet-Based Authentication:** Securely connect and log in using an Ethereum wallet like MetaMask.
-   **Persistent Sessions:** Automatically reconnects your wallet on page reload for a seamless user experience.
-   **Unique Username Registration:** Users can claim a unique, human-readable username on the blockchain.
-   **Friend Management:** Add friends using either their unique username or their full Ethereum address.
-   **Real-time Messaging:** Messages are transmitted instantly between users via blockchain events, listened to by a reliable WebSocket connection.
-   **Historical Chat Fetching:** When a chat is opened, the full conversation history is queried from past blockchain events.
-   **Responsive & Modern UI:** A clean, two-panel user interface with colored user avatars that adapts to different screen sizes.

---

## 🛠️ Technology Stack

-   **Blockchain:** Solidity, Ethereum
-   **Development Environment:** Hardhat
-   **Frontend Library:** React
-   **EVM Interaction:** Ethers.js
-   **Wallet:** MetaMask

---

## 🚀 Getting Started

Follow these steps to set up and run the project on your local machine.

### Prerequisites

-   **Node.js** (v18 or later)
-   **npm** or **yarn**
-   **MetaMask** browser extension

### 1. Backend Setup (Hardhat)

First, set up the local blockchain and deploy the smart contract.

1.  **Clone the Repository:**
    ```sh
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Install Dependencies:**
    ```sh
    npm install
    ```

3.  **Start the Local Hardhat Node:**
    Open a terminal and run:
    ```sh
    npx hardhat node
    ```
    This will start a local blockchain instance and give you a list of 20 test accounts with ETH. Keep this terminal running.

4.  **Deploy the Smart Contract:**
    Open a **second terminal** and run the deployment script:
    ```sh
    npx hardhat run scripts/deploy.js --network localhost
    ```
    After it finishes, it will print the deployed contract address. **Copy this address.**

### 2. Frontend Setup (React)

Now, connect the React frontend to your deployed contract.

1.  **Update Contract Constants:**
    Open the `src/constants/index.js` file in your project.
    -   Paste the **contract address** you copied into the `contractAddress` variable.
    -   Go to `artifacts/contracts/ChatApp.sol/ChatApp.json`, copy the entire `abi` array, and paste it into the `contractABI` variable.

2.  **Start the Frontend Application:**
    In the second terminal (or a new one), run:
    ```sh
    npm run dev
    ```
    Your application should now be running, typically at `http://localhost:5173`.

---

## 📖 Usage Workflow

To test the chat functionality, you need to simulate two different users.

1.  **Open Two Browsers:** Use two different browsers (e.g., Chrome and Firefox) or two different profiles in Chrome.

2.  **Configure MetaMask:**
    -   In Browser A, connect MetaMask to the "Localhost 8545" network and select **Account #1** from the Hardhat node list.
    -   In Browser B, connect MetaMask to the "Localhost 8545" network and select **Account #2**.

3.  **Register Users:**
    -   In Browser A, register a username (e.g., "Alice").
    -   In Browser B, register a different username (e.g., "Bob").

4.  **Add Friend:**
    -   In Browser A, click the "Add Friend" button and type "Bob" (or Bob's address) to add him as a friend.

5.  **Start Chatting:**
    -   Both users can now click on each other's names in the contact list to start a real-time, decentralized conversation.
