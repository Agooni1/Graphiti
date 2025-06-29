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

contract YourCollectible is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
	ERC721Burnable,
	ERC721Royalty,
    Ownable,
	Pausable,
	ReentrancyGuard
{
    uint256 public tokenIdCounter;
    uint256 public price = 0.001 ether;

    // Cosmic graph specific mappings
    struct CosmicGraphData {
        address targetAddress;
        bool exists;
    }

    mapping(uint256 => CosmicGraphData) public cosmicGraphs;
    mapping(address => uint256) public addressToTokenId;

    event CosmicGraphMinted(
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

    constructor() ERC721("Cosmic Graph Collection", "CSMC") Ownable(msg.sender) {
		_setDefaultRoyalty(msg.sender, 500);
	}

    function _baseURI() internal pure override returns (string memory) {
        // return "https://ipfs.io/ipfs/";
		// return "https://aqua-nearby-barracuda-607.mypinata.cloud/ipfs/";
		// return "https://gateway.pinata.cloud/ipfs/";
		return "";
    }	

    function setPrice(uint256 _price) public onlyOwner {
        
        uint256 oldPrice = price;
        if (oldPrice != _price) {  // Only update and emit if actually changing
            price = _price;
            emit PriceUpdated(oldPrice, _price);
        }
    }

	/**
	 * @dev Mint a cosmic graph NFT for a specific Ethereum address
	 * @param _targetAddress The Ethereum address to create the cosmic graph for
	 * @param _ipfsHash The IPFS hash containing the graph metadata
	 */
	function mintGraph(address _targetAddress, string memory _ipfsHash) 
		public 
		payable 
		whenNotPaused
		returns (uint256) 
	{
		if (msg.sender == _targetAddress) revert InvalidTargetAddress(); // Prevent self-minting
		if (msg.value < price) revert InsufficientPayment();
		if (_targetAddress == address(0)) revert InvalidTargetAddress();
		if (bytes(_ipfsHash).length == 0) revert EmptyIPFSHash();
		if (cosmicGraphs[addressToTokenId[_targetAddress]].exists) revert AlreadyExists();

		uint256 _tokenId = ++tokenIdCounter; // Pre-increment saves gas

		// Store cosmic graph data
		cosmicGraphs[_tokenId] = CosmicGraphData(_targetAddress, true);
		addressToTokenId[_targetAddress] = _tokenId;

		_safeMint(msg.sender, _tokenId);
		_setTokenURI(_tokenId, _ipfsHash);

		emit CosmicGraphMinted(_tokenId, _targetAddress, msg.sender, _ipfsHash);
		return _tokenId;
	}

	/**
	 * @dev Check if a cosmic graph exists for an address
	 */
	function hasCosmicGraph(address _targetAddress) public view returns (bool, uint256) {
		uint256 _tokenId = addressToTokenId[_targetAddress];
		return (_tokenId != 0, _tokenId);
	}

	/**
	 * @dev Get the cosmic graph token ID for an address
	 * @dev Returns 0 if no graph exists
	 */
	function getCosmicGraphTokenId(address _targetAddress) public view returns (uint256) {
		return addressToTokenId[_targetAddress];
	}

	function masterMint(address _targetAddress, string memory _ipfsHash) 
		external 
		onlyOwner 
		whenNotPaused 
		returns (uint256) 
	{
		if (bytes(_ipfsHash).length == 0) revert EmptyIPFSHash();
		if (cosmicGraphs[addressToTokenId[_targetAddress]].exists) revert AlreadyExists();

		uint256 _tokenId = ++tokenIdCounter; // Pre-increment saves gas

		// Store cosmic graph data
		cosmicGraphs[_tokenId] = CosmicGraphData(_targetAddress, true);
		addressToTokenId[_targetAddress] = _tokenId;

		_safeMint(msg.sender, _tokenId);
		_setTokenURI(_tokenId, _ipfsHash);

		emit CosmicGraphMinted(_tokenId, _targetAddress, msg.sender, _ipfsHash);
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
		return super._update(_to, _tokenId, _auth);
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
	function withdraw() public onlyOwner nonReentrant {
		uint256 _balance = address(this).balance;
		if (_balance == 0) revert NoFundsToWithdraw();
		
		(bool success, ) = payable(owner()).call{value: _balance}("");
		require(success, "Transfer failed");
	}


	// Update royalty information
	function updateDefaultRoyalty(address receiver, uint96 fee) external onlyOwner {
    require(receiver != address(0), "Invalid receiver");
    require(fee <= 1000, "Royalty too high"); // 10% max
    _setDefaultRoyalty(receiver, fee);
    emit RoyaltyUpdated(receiver, fee);
}

	function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
