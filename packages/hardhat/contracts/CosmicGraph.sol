// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title CosmicGraph
 * @dev NFT contract for minting interactive cosmic graph visualizations
 * @notice Each address can mint one cosmic graph NFT representing their transaction history
 */
contract CosmicGraph is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
	ERC721Burnable,
	ERC721Royalty,
    Ownable,
	Pausable,
	ReentrancyGuard
{
    using MessageHashUtils for bytes32;

    // ============ STATE VARIABLES ============

    address public authorizedSigner;  // Backend signer for mint authorization
    uint96 public basePrice;          // Base price for first mint (exponential after)
    uint256 public tokenIdCounter;    // Counter for token IDs (starts at 0)

    // ============ STRUCTS ============

    struct CosmicGraphData {
        address targetAddress;  // Address this cosmic graph represents
        uint96 mintTimestamp;   // When the NFT was minted
    }

    // ============ MAPPINGS ============

    mapping(address => uint256) public nonces;              // User nonces for signature verification
    mapping(uint256 => CosmicGraphData) public cosmicGraphs; // Token ID to cosmic graph data
    mapping(address => uint256) public addressToTokenId;    // Address to their cosmic graph token ID

    // ============ EVENTS ============

    event CosmicGraphMinted(
        uint256 indexed tokenId, 
        address indexed minter,
        string ipfsHash
    );

    event CosmicGraphMasterMinted(
        uint256 indexed tokenId, 
        address indexed targetAddress,
        address indexed minter,
        string ipfsHash
    );

    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event RoyaltyUpdated(address indexed receiver, uint96 fee);

    // ============ ERRORS ============

	error InsufficientPayment(uint256 sent, uint256 required);
	error InvalidTargetAddress();
	error EmptyIPFSHash();
	error NoFundsToWithdraw();
	error ZeroDeposit();
    error AlreadyExists(address user, uint256 existingTokenId);
	error TransferFailed();
    error NotCiDv0();
    error CIDTooShort();
    error BadSignature();
    error InvalidIPFSHash();
    error SignatureVerificationFailed();
    error ContractPaused();
    error RoyaltyTooHigh();
    error InvalidAddress();

    // ============ CONSTRUCTOR ============

    constructor(address _auth, uint96 _basePrice) ERC721("Cosmic Graph Collection", "CSMC") Ownable(msg.sender) {
		_setDefaultRoyalty(msg.sender, 500);
        authorizedSigner = _auth;
        basePrice = _basePrice;
	}

    // ============ PUBLIC FUNCTIONS ============

    /**
     * @dev Mint a cosmic graph NFT for the caller's address
     * @param _ipfsHash The IPFS hash containing the graph metadata and visualization
     * @param _signature Backend signature authorizing this mint
     * @return tokenId The minted token ID
     */
    function mintGraph(string memory _ipfsHash, bytes memory _signature) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
        returns (uint256) 
    {
        uint256 currentNonce = nonces[msg.sender];
        uint256 existingTokenId = addressToTokenId[msg.sender];
        uint256 currentTokenId = tokenIdCounter;

        
        if (msg.value < userPrice(msg.sender)) {
            revert InsufficientPayment(msg.value, userPrice(msg.sender));
        }
        if (existingTokenId != 0) {
            revert AlreadyExists(msg.sender, existingTokenId);
        }
        
        // Basic IPFS hash validation
        bytes memory ipfsBytes = bytes(_ipfsHash);
        uint256 len = ipfsBytes.length;
        if (len == 0) revert EmptyIPFSHash();
        if (len < 46 || ipfsBytes[0] != 'Q' || ipfsBytes[1] != 'm') {
            revert InvalidIPFSHash();
        }     
                
        // Verify backend signature
        if (!verifySignature(_ipfsHash, _signature, currentNonce)) revert BadSignature();

        // Mint the NFT
        uint256 tokenId = currentTokenId + 1;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _ipfsHash);

        tokenIdCounter = tokenId;

        // Store cosmic graph data
        cosmicGraphs[tokenId] = CosmicGraphData({
            targetAddress: msg.sender,
            mintTimestamp: uint96(block.timestamp)
        });

        addressToTokenId[msg.sender] = tokenId;

        nonces[msg.sender] = currentNonce + 1;

        emit CosmicGraphMinted(tokenId, msg.sender, _ipfsHash);
        return tokenId;
    }

    /**
     * @dev Master mint function to create a cosmic graph for another address
     * @param _targetAddress The address to mint the cosmic graph for
     * @param _ipfsHash The IPFS hash containing the graph metadata and visualization
     * @return tokenId The minted token ID
     */
    function masterMint(address _targetAddress, string memory _ipfsHash) 
        external 
        onlyOwner 
        whenNotPaused 
        nonReentrant
        returns (uint256) 
    {
        uint256 existingTokenId = addressToTokenId[_targetAddress];
        uint256 currentTokenId = tokenIdCounter;
        // Check if target already has a cosmic graph
        if (existingTokenId != 0) {
            revert AlreadyExists(_targetAddress, existingTokenId);
        }

        // Validate IPFS hash
        bytes memory ipfsBytes = bytes(_ipfsHash);
        uint256 len = ipfsBytes.length;
        if (len == 0) revert EmptyIPFSHash();
        if (len < 46 || ipfsBytes[0] != 'Q' || ipfsBytes[1] != 'm') {
            revert InvalidIPFSHash();
        }
        
        // Mint the NFT to owner (who holds it on behalf of target address)
        uint256 tokenId = currentTokenId + 1;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _ipfsHash);

        tokenIdCounter = tokenId;

        // Store cosmic graph data mapping to target address
        cosmicGraphs[tokenId] = CosmicGraphData({
            targetAddress: _targetAddress,
            mintTimestamp: uint96(block.timestamp)
        });

        addressToTokenId[_targetAddress] = tokenId;

        emit CosmicGraphMasterMinted(tokenId, _targetAddress, msg.sender, _ipfsHash);
        return tokenId;
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Calculate the mint price for a user based on their nonce
     * @param _user The user address
     * @return price The mint price in wei (exponential: basePrice * 2^nonce)
     * @notice Price doubles with each mint to prevent spam
     */
    function userPrice(address _user) public view returns (uint256) {
        uint256 userNonce = nonces[_user];
        uint256 cachedBasePrice = basePrice;
        if (userNonce == 0) return cachedBasePrice;
        if (userNonce >= 10) return cachedBasePrice << 10; // Cap at 1024x
        return cachedBasePrice << userNonce;
    }

    /**
     * @dev Check if a cosmic graph exists for an address
     */
    function hasCosmicGraph(address _address) external view returns (bool) {
        if (_address == address(0)) return false;
        return addressToTokenId[_address] != 0;
    }

    /**
     * @dev Get the cosmic graph token ID for an address
     * @dev Returns 0 if no graph exists
     */
    function getCosmicGraphTokenId(address _targetAddress) external view returns (uint256) {
        return addressToTokenId[_targetAddress];
    }

    // ============ ADMIN FUNCTIONS ============

    function setBasePrice(uint96 _price) external onlyOwner nonReentrant{
        uint96 oldPrice = basePrice;
        if (oldPrice != _price) {  // Only update and emit if actually changing
            basePrice = _price;
            emit PriceUpdated(oldPrice, _price);
        }
    }

    function setAuthorizedSigner(address _signer) external onlyOwner nonReentrant {
        if (_signer == address(0)) revert InvalidAddress();
        authorizedSigner = _signer;
    }

    // Update royalty information
    function updateDefaultRoyalty(address receiver, uint96 fee) external onlyOwner nonReentrant{
        require(receiver != address(0), "Invalid receiver");
        require(fee <= 1000, "Royalty too high"); // 10% max
        _setDefaultRoyalty(receiver, fee);
        emit RoyaltyUpdated(receiver, fee);
    }

    function pause() external onlyOwner nonReentrant{
        _pause();
    }

    function unpause() external onlyOwner nonReentrant {
        _unpause();
    }

    // Allow owner to withdraw funds
	function withdraw() external onlyOwner nonReentrant {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        if (!success) {
            revert TransferFailed();
        }
    }

	// Withdraw Balance to Address
	function withdrawTo(address payable _to) public onlyOwner nonReentrant {
        (bool success, ) = payable(_to).call{value: address(this).balance}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    // ============ INTERNAL FUNCTIONS ============

    function _baseURI() internal pure override returns (string memory) {
		return "";
    }	

    function verifySignature(string memory _ipfsHash, bytes memory _signature, uint256 _currentNonce) 
        internal view returns (bool) 
    {
        bytes32 messageHash = keccak256(abi.encodePacked(_ipfsHash, msg.sender, _currentNonce+1));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        return ECDSA.recover(ethSignedMessageHash, _signature) == authorizedSigner;
    }

    function _update(
		address _to, 
		uint256 _tokenId, 
		address _auth
	) internal override(ERC721, ERC721Enumerable) returns (address) {
		address previousOwner = super._update(_to, _tokenId, _auth);

        // Clean up mappings when burning
        if (_to == address(0)) {
            address _target = cosmicGraphs[_tokenId].targetAddress;

            // Only delete if the mappings point correctly
            if (_target != address(0) && addressToTokenId[_target] == _tokenId) {
                delete addressToTokenId[_target];
            }

            delete cosmicGraphs[_tokenId];
        }
        
        return previousOwner;
	}

    // ============ OVERRIDES ============
	
	function _increaseBalance(address _account, uint128 _amount) internal override(ERC721, ERC721Enumerable) {
		super._increaseBalance(_account, _amount);
	}

    function tokenURI(uint256 _tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(_tokenId);
    }

    function supportsInterface(bytes4 _interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(_interfaceId);
    }

    // ============ RECEIVE ============

	receive() external payable {}

}
