// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ChatApp
 * @author Gemini
 * @notice A decentralized chat application contract on Ethereum.
 * It allows users to register, add friends, create groups, and send messages.
 * Messages are not stored on-chain to save gas; instead, they are emitted as events
 * that a frontend client can listen to.
 */
contract ChatApp {
    // ==============================================================================
    // State Variables
    // ==============================================================================

    struct User {
        string name;
        address accountAddress;
    }

    struct Group {
        uint256 groupId;
        string groupName;
        address owner;
        mapping(address => bool) isMember;
        address[] members;
    }

    mapping(address => User) private allUsers;
    mapping(string => bool) private isUsernameTaken;
    // NEW: Reverse mapping from username to address for easy lookup.
    mapping(string => address) private userAddressByName;

    mapping(address => mapping(address => bool)) private friendships;
    mapping(address => address[]) private friendLists;

    Group[] private allGroups;
    mapping(uint256 => uint256) private groupIdToIndex;
    uint256 private nextGroupId;

    // ==============================================================================
    // Events
    // ==============================================================================

    event UserCreated(address indexed userAddress, string name);
    event FriendAdded(address indexed user1, address indexed user2);
    event GroupCreated(uint256 indexed groupId, string groupName, address indexed owner);
    event MemberAddedToGroup(uint256 indexed groupId, address indexed member);
    event NewMessage(address indexed from, address indexed to, string message, uint256 timestamp);
    event NewGroupMessage(address indexed from, uint256 indexed groupId, string message, uint256 timestamp);

    // ==============================================================================
    // Modifiers
    // ==============================================================================

    modifier userExists(address _addr) {
        require(bytes(allUsers[_addr].name).length > 0, "User does not exist.");
        _;
    }

    modifier userDoesNotExist(address _addr) {
        require(bytes(allUsers[_addr].name).length == 0, "User already exists.");
        _;
    }

    modifier isGroupMember(uint256 _groupId) {
        uint256 groupIndex = groupIdToIndex[_groupId];
        require(allGroups[groupIndex].isMember[msg.sender], "You are not a member of this group.");
        _;
    }

    // ==============================================================================
    // Core Functions
    // ==============================================================================

    function createUser(string calldata _name) external userDoesNotExist(msg.sender) {
        require(!isUsernameTaken[_name], "Username is already taken.");
        
        allUsers[msg.sender] = User({ name: _name, accountAddress: msg.sender });
        isUsernameTaken[_name] = true;
        userAddressByName[_name] = msg.sender; // NEW: Store the reverse mapping.

        emit UserCreated(msg.sender, _name);
    }

    function addFriend(address _friendAddress) public userExists(msg.sender) userExists(_friendAddress) {
        require(msg.sender != _friendAddress, "You cannot add yourself as a friend.");
        require(!friendships[msg.sender][_friendAddress], "You are already friends.");

        friendships[msg.sender][_friendAddress] = true;
        friendships[_friendAddress][msg.sender] = true;

        friendLists[msg.sender].push(_friendAddress);
        friendLists[_friendAddress].push(msg.sender);

        emit FriendAdded(msg.sender, _friendAddress);
    }

    /**
     * @notice NEW: Adds a friend by their unique username.
     * @param _username The username of the user to add as a friend.
     */
    function addFriendByUsername(string calldata _username) external userExists(msg.sender) {
        // Look up the friend's address using the new mapping
        address friendAddress = userAddressByName[_username];

        // Ensure the username exists
        require(friendAddress != address(0), "User with this username does not exist.");

        // Call the existing addFriend function with the resolved address.
        // The `addFriend` function is now public so this contract can call it.
        addFriend(friendAddress);
    }

    function sendMessage(address _recipient, string calldata _message) external userExists(msg.sender) userExists(_recipient) {
        require(friendships[msg.sender][_recipient], "You can only message your friends.");
        emit NewMessage(msg.sender, _recipient, _message, block.timestamp);
    }

    function createGroup(string calldata _groupName, address[] calldata _initialMembers) external userExists(msg.sender) {
        uint256 groupId = nextGroupId;
        uint256 groupIndex = allGroups.length;

        allGroups.push();
        Group storage newGroup = allGroups[groupIndex];

        newGroup.groupId = groupId;
        newGroup.groupName = _groupName;
        newGroup.owner = msg.sender;

        newGroup.isMember[msg.sender] = true;
        newGroup.members.push(msg.sender);

        for (uint i = 0; i < _initialMembers.length; i++) {
            address member = _initialMembers[i];
            if (bytes(allUsers[member].name).length > 0 && !newGroup.isMember[member]) {
                newGroup.isMember[member] = true;
                newGroup.members.push(member);
                emit MemberAddedToGroup(groupId, member);
            }
        }

        groupIdToIndex[groupId] = groupIndex;
        nextGroupId++;

        emit GroupCreated(groupId, _groupName, msg.sender);
    }

    function sendGroupMessage(uint256 _groupId, string calldata _message) external isGroupMember(_groupId) {
        emit NewGroupMessage(msg.sender, _groupId, _message, block.timestamp);
    }

    // ==============================================================================
    // View/Getter Functions
    // ==============================================================================

    function getUser(address _userAddress) external view returns (string memory) {
        return allUsers[_userAddress].name;
    }



    function getFriendList(address _userAddress) external view returns (address[] memory) {
        return friendLists[_userAddress];
    }
    
    function getGroupDetails(uint256 _groupId) external view returns (uint256, string memory, address, address[] memory) {
        uint256 groupIndex = groupIdToIndex[_groupId];
        require(groupIndex < allGroups.length, "Group does not exist.");
        Group storage group = allGroups[groupIndex];
        return (group.groupId, group.groupName, group.owner, group.members);
    }

    function getUserGroups(address _userAddress) external view returns (uint256[] memory) {
        uint256 memberGroupCount = 0;
        for (uint i = 0; i < allGroups.length; i++) {
            if (allGroups[i].isMember[_userAddress]) {
                memberGroupCount++;
            }
        }

        uint256[] memory userGroupIds = new uint256[](memberGroupCount);
        uint256 counter = 0;
        for (uint i = 0; i < allGroups.length; i++) {
            if (allGroups[i].isMember[_userAddress]) {
                userGroupIds[counter] = allGroups[i].groupId;
                counter++;
            }
        }
        return userGroupIds;
    }
}