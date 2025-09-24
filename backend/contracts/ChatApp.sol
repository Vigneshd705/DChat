// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ChatApp
 * @notice A decentralized chat application supporting both on-chain text and off-chain IPFS content.
 */
contract ChatApp {
    // ==============================================================================
    // State Variables, Structs, Modifiers
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

    // HYBRID MESSAGING EVENTS
    event NewTextMessage(address indexed from, address indexed to, string message, uint256 timestamp);
    event NewIPFSMessage(address indexed from, address indexed to, string ipfsCid, string fileName, uint256 timestamp);
    
    event NewGroupTextMessage(address indexed from, uint256 indexed groupId, string message, uint256 timestamp);
    event NewGroupIPFSMessage(address indexed from, uint256 indexed groupId, string ipfsCid, string fileName, uint256 timestamp);

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
        require(groupIndex < allGroups.length, "Group does not exist.");
        require(allGroups[groupIndex].isMember[msg.sender], "You are not a member of this group.");
        _;
    }

    // ==============================================================================
    // Core Functions
    // ==============================================================================

    function createUser(string calldata _name) external userDoesNotExist(msg.sender) {
        require(bytes(_name).length > 0, "Username cannot be empty.");
        require(!isUsernameTaken[_name], "Username is already taken.");
        
        allUsers[msg.sender] = User({ name: _name, accountAddress: msg.sender });
        isUsernameTaken[_name] = true;
        userAddressByName[_name] = msg.sender;

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

    function addFriendByUsername(string calldata _username) external userExists(msg.sender) {
        address friendAddress = userAddressByName[_username];
        require(friendAddress != address(0), "User with this username does not exist.");
        addFriend(friendAddress);
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

    // --- Hybrid Messaging Functions ---

    function sendMessageText(address _recipient, string calldata _message) external userExists(msg.sender) userExists(_recipient) {
        require(friendships[msg.sender][_recipient], "You can only message your friends.");
        emit NewTextMessage(msg.sender, _recipient, _message, block.timestamp);
    }

    function sendMessageIPFS(address _recipient, string calldata _ipfsCid, string calldata _fileName) external userExists(msg.sender) userExists(_recipient) {
        require(friendships[msg.sender][_recipient], "You can only message your friends.");
        emit NewIPFSMessage(msg.sender, _recipient, _ipfsCid, _fileName, block.timestamp);
    }
    
    function sendGroupTextMessage(uint256 _groupId, string calldata _message) external isGroupMember(_groupId) {
        emit NewGroupTextMessage(msg.sender, _groupId, _message, block.timestamp);
    }

    function sendGroupIPFSMessage(uint256 _groupId, string calldata _ipfsCid, string calldata _fileName) external isGroupMember(_groupId) {
        emit NewGroupIPFSMessage(msg.sender, _groupId, _ipfsCid, _fileName, block.timestamp);
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