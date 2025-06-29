// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract YourCollectible is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
	ERC721Burnable,
	ERC721Royalty,
    Ownable,
	Pausable
{
    uint256 public tokenIdCounter;
    uint256 public price = 0.001 ether;

    // Cosmic graph specific mappings
    mapping(uint256 => address) public target;
    mapping(address => uint256) public addressToTokenId;

    event CosmicGraphMinted(
        uint256 indexed tokenId, 
        address indexed targetAddress, 
        address indexed minter,
        string ipfsHash
    );
    event CosmicGraphRequested(
        uint256 indexed tokenId, 
        address indexed targetAddress, 
        address indexed requester
    );

    constructor() ERC721("Cosmic Graph Collection", "CSMC") Ownable(msg.sender) {
		_setDefaultRoyalty(msg.sender, 500);
	}

	function deposit() external payable {
    require(msg.value > 0, "Must send some ETH");
	}

	
	

    function _baseURI() internal pure override returns (string memory) {
        // return "https://ipfs.io/ipfs/";
		// return "https://aqua-nearby-barracuda-607.mypinata.cloud/ipfs/";
		// return "https://gateway.pinata.cloud/ipfs/";
		return "";
    }
	

    function setPrice(uint256 _price) public onlyOwner { 
        price = _price;	
    }

	/**
	 * @dev Mint a cosmic graph NFT for a specific Ethereum address
	 * @param _targetAddress The Ethereum address to create the cosmic graph for
	 * @param _ipfsHash The IPFS hash containing the graph metadata
	 */
	function mintCosmicGraph(address _targetAddress, string memory _ipfsHash) 
		public 
		payable 
		whenNotPaused
		returns (uint256) 
	{
		// require(msg.sender == _targetAddress, "You can only mint for yourself"); //for now, allow anyone to mint for any address
		require(msg.value >= price, "Insufficient payment for minting");
		require(msg.sender.balance >= price, "Insufficient balance to mint");
		require(_targetAddress != address(0), "Cannot create graph for zero address");
		// require(addressToTokenId[_targetAddress] == 0, "Graph already exists for this address");
		require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");

		tokenIdCounter++;
		uint256 _tokenId = tokenIdCounter;

		// Store cosmic graph data
		target[_tokenId] = _targetAddress;
		addressToTokenId[_targetAddress] = _tokenId;

		_safeMint(msg.sender, _tokenId);
		_setTokenURI(_tokenId, _ipfsHash);

		emit CosmicGraphMinted(_tokenId, _targetAddress, msg.sender, _ipfsHash);
		return _tokenId;
	}

	
	/**
	 * @dev Get cosmic graph information for a token
	 */
	function getCosmicGraphInfo(uint256 _tokenId) 
		public 
		view 
		returns (
			address _targetAddress,
			address _owner,
			string memory _tokenURI
		) 
	{
		require(_ownerOf(_tokenId) != address(0), "Token does not exist");
		
		_targetAddress = target[_tokenId];
		_owner = ownerOf(_tokenId);
		_tokenURI = tokenURI(_tokenId);
	}

	/**
	 * @dev Check if a cosmic graph exists for an address
	 */
	function hasCosmicGraph(address _targetAddress) public view returns (bool, uint256) {
		uint256 _tokenId = addressToTokenId[_targetAddress];
		return (_tokenId != 0, _tokenId);
	}

	// Keep your existing functions
	function usermint(string memory _uri) public payable returns (uint256) {
		address _to = msg.sender;
		require (msg.value >= price, "Minting requires a payment");
		require(_to != address(0), "Cannot mint to the zero address");
		tokenIdCounter++;
		uint256 _tokenId = tokenIdCounter;
		_safeMint(_to, _tokenId);
		_setTokenURI(_tokenId, _uri);
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
	function withdraw() public onlyOwner {
		uint256 _balance = address(this).balance;
		require(_balance > 0, "No funds to withdraw");
		payable(owner()).transfer(_balance);
	}
	// Update royalty information
	function updateDefaultRoyalty(address receiver, uint96 fee) external onlyOwner{
    _setDefaultRoyalty(receiver, fee);
}

	function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
