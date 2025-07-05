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
import "hardhat/console.sol"; // For debugging purposes, can be removed in production

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


    uint256 public tokenIdCounter;
    uint256 public price = 0.001 ether;

    // Cosmic graph specific mappings
    struct CosmicGraphData {
        address targetAddress;
    }

    mapping(address => uint256) public nonces;
    mapping(uint256 => CosmicGraphData) public cosmicGraphs;
    mapping(address => uint256) public addressToTokenId;
    mapping(address => uint256) public lastMintedAt;

    address public authorizedSigner;


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

	error InsufficientPayment();
	error InvalidTargetAddress();
	error EmptyIPFSHash();
	error NoFundsToWithdraw();
	error ZeroDeposit();
    error AlreadyExists();
	error TransferFailed();
    error NotCiDv0();
    error CIDTooShort();
    error BadSignature();

    constructor(address _o, address _auth) ERC721("Cosmic Graph Collection", "CSMC") Ownable(_o) {
		_setDefaultRoyalty(msg.sender, 500);
        authorizedSigner = _auth;
	}

    function _baseURI() internal pure override returns (string memory) {
		return "";
    }	

    function setPrice(uint256 _price) external onlyOwner nonReentrant{
        uint256 oldPrice = price;
        if (oldPrice != _price) {  // Only update and emit if actually changing
            price = _price;
            emit PriceUpdated(oldPrice, _price);
        }
    }

    /**
     * @dev Mint a cosmic graph NFT for a specific Ethereum address
     * @param _ipfsHash The IPFS hash containing the graph metadata
     */
    function mintGraph(address _targetAddress, string memory _ipfsHash, bytes memory _signature) 
        external 
        payable 
        whenNotPaused
        nonReentrant
        returns (uint256) 
    {
        // if (msg.sender != _targetAddress) revert InvalidTargetAddress(); 
        if (msg.value < price) revert InsufficientPayment();
        // if (_targetAddress == address(0)) revert InvalidTargetAddress();
        if (bytes(_ipfsHash).length == 0) revert EmptyIPFSHash();

        //basic IPFS hash validation
        if (bytes(_ipfsHash).length < 46) revert CIDTooShort();
        if (bytes(_ipfsHash)[0] != 'Q') revert NotCiDv0();
        if (bytes(_ipfsHash)[1] != 'm') revert NotCiDv0();
        
        uint256 existingTokenId = addressToTokenId[msg.sender];
        if (existingTokenId != 0) revert AlreadyExists();
        
        if (!verifySignature(_ipfsHash, _signature)) revert BadSignature();

        uint256 _tokenId = ++tokenIdCounter; // Pre-increment saves gas   

        _safeMint(msg.sender, _tokenId);
        _setTokenURI(_tokenId, _ipfsHash);             

        // Store cosmic graph data
        cosmicGraphs[_tokenId] = CosmicGraphData(_targetAddress);
        addressToTokenId[msg.sender] = _tokenId;

        nonces[msg.sender]++;

        emit CosmicGraphMinted(_tokenId, msg.sender, _ipfsHash);
        return _tokenId;
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

     // Owner unrestricted mint
    function masterMint(address _targetAddress, string memory _ipfsHash) 
        external 
        onlyOwner 
        whenNotPaused 
        nonReentrant
        returns (uint256) 
    {
        if (bytes(_ipfsHash).length == 0) revert EmptyIPFSHash();
        // if (cosmicGraphs[addressToTokenId[_targetAddress]].exists) revert AlreadyExists();
        if (bytes(_ipfsHash).length < 46) revert CIDTooShort();
        if (bytes(_ipfsHash)[0] != 'Q') revert NotCiDv0();
        if (bytes(_ipfsHash)[1] != 'm') revert NotCiDv0();
        
        uint256 _tokenId = ++tokenIdCounter;

        _safeMint(msg.sender, _tokenId);
        _setTokenURI(_tokenId, _ipfsHash);

        // Store cosmic graph data
        cosmicGraphs[_tokenId] = CosmicGraphData(_targetAddress);
        addressToTokenId[_targetAddress] = _tokenId;

        emit CosmicGraphMasterMinted(_tokenId, _targetAddress, msg.sender, _ipfsHash);
        return _tokenId;
    }

	// Required overrides...
	function _increaseBalance(address _account, uint128 _amount) internal override(ERC721, ERC721Enumerable) {
		super._increaseBalance(_account, _amount);
	}

	function _update(
		address _to, 
		uint256 _tokenId, 
		address _auth
	) internal override(ERC721, ERC721Enumerable) returns (address) {
		address previousOwner = super._update(_to, _tokenId, _auth);

        if (_to == address(0)) {
            // Burning: safely clean up mappings
            address _target = cosmicGraphs[_tokenId].targetAddress;

            // Only delete if the mappings point correctly
            if (addressToTokenId[_target] == _tokenId) {
                delete addressToTokenId[_target];
            }

            delete cosmicGraphs[_tokenId];
        }
        
        return previousOwner;
	}

	function tokenURI(
		uint256 _tokenId
	) public view override(ERC721, ERC721URIStorage) returns (string memory) {
		return super.tokenURI(_tokenId);
	}

	function supportsInterface(
		bytes4 _interfaceId
	)
		public
		view
		override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty)
		returns (bool)
	{
		return super.supportsInterface(_interfaceId);
	}

	// Allow contract to receive ETH
	receive() external payable {}

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

    function setAuthorizedSigner(address _signer) external onlyOwner nonReentrant{
        authorizedSigner = _signer;
    }

    
    function verifySignature(string memory _ipfsHash, bytes memory _signature) internal view returns (bool) {
        
        bytes32 messageHash = keccak256(abi.encodePacked(_ipfsHash, msg.sender, nonces[msg.sender]+1));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
    
        return ECDSA.recover(ethSignedMessageHash, _signature) == authorizedSigner;
    }
}
