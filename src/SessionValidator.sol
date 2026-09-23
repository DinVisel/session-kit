// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SessionValidator{
    struct Session {
        address userAddress;      // Asıl cüzdan sahibi
        address sessionSigner;    // Oyunda/uygulamada yetkilendirilen geçici anahtar
        uint256 validUntil;       // Geçerlilik bitiş zamanı (Unix timestamp)
        uint256 maxSpendAmount;   // Harcanabilecek maksimum tutar
    }

    //geçici anahtar adreslerinden oturum kurallarına harita
    mapping(address => Session) public sessions;

    // 1. Oturum Açma (Asıl kullanıcı bir kez çağırır)
    function enableSession(address _sessionSigner, uint256 _duration, uint256 _maxSpend) external {
        sessions[_sessionSigner] = Session({
            userAddress: msg.sender,
            sessionSigner: _sessionSigner,
            validUntil: block.timestamp + _duration,
            maxSpendAmount: _maxSpend
        });
    }

    // 2. Kural Doğrulama (İşlem anında çağrılır)
    function validateSession(address _sessionSigner, uint256 _spendAmount) external view returns (bool) {
        Session memory session = sessions[_sessionSigner];
        
        // Şartlar sağlanıyor mu kontrol et:
        if (block.timestamp > session.validUntil) return false; // Süre dolmuş
        if (_spendAmount > session.maxSpendAmount) return false; // Limit aşılmış
        
        return true;
    }
}