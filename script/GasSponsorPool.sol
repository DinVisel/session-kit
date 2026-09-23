contract GasSponsorPool {
    address public appOwner;

    constructor() {
        appOwner = msg.sender;
    }

    // Havuza bütçe yükleme
    receive() external payable {}

    // Kullanıcının işlemi yerine getiren aracının (relayer) gaz masrafını iade et
    function sponsorTransaction(address payable _relayer, uint256 _gasCost) external {
        require(msg.sender == appOwner, "Yetkisiz!");
        require(address(this).balance >= _gasCost, "Havuzda bakiye bitti!");
        
        _relayer.transfer(_gasCost);
    }
}