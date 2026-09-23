// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SessionValidator} from "../src/SessionValidator.sol";

contract SessionValidatorTest is Test {
    SessionValidator public validator;

    // Test aktörleri (sanal cüzdan adresleri)
    address public alice = address(0xAAA);          // Asıl kullanıcı
    address public sessionKey = address(0xBBB);     // Oyunun geçici oturum anahtarı

    function setUp() public {
        // Her testten önce sözleşmeyi sıfırdan dağıt
        validator = new SessionValidator();
    }

    // 1. Başarılı Senaryo: Süre dolmamış ve limit aşılmamış
    function test_ValidSession() public {
        // vm.prank: Bir sonraki işlemi 'alice' çağırıyormuş gibi simüle eder
        vm.prank(alice);
        validator.enableSession(sessionKey, 1 hours, 100);

        // 10 dakika sonrasına gidelim (blokzincir zamanını ileri al)
        vm.warp(block.timestamp + 10 minutes);

        // 50 birimlik harcama geçerli mi?
        bool isValid = validator.validateSession(sessionKey, 50);
        assertTrue(isValid, "Oturum gecerli olmaliydi");
    }

    // 2. Başarısız Senaryo: Süre aşımı (Time Expiry)
    function test_RevertWhen_SessionExpired() public {
        vm.prank(alice);
        validator.enableSession(sessionKey, 1 hours, 100);

        // Zamanı 1 saat 1 saniye ileri sar (oturum süresi bitti)
        vm.warp(block.timestamp + 1 hours + 1 seconds);

        // Harcama limiti dahilinde olsa bile süre dolduğu için reddedilmeli
        bool isValid = validator.validateSession(sessionKey, 20);
        assertFalse(isValid, "Sure doldugu icin oturum gecersiz olmaliydi");
    }

    // 3. Başarısız Senaryo: Limit aşımı (Overspend)
    function test_RevertWhen_ExceedsMaxSpend() public {
        vm.prank(alice);
        validator.enableSession(sessionKey, 1 hours, 100);

        // Süre henüz dolmadı ama limit 100 iken 101 harcanmak isteniyor
        bool isValid = validator.validateSession(sessionKey, 101);
        assertFalse(isValid, "Limit asildigi icin islem reddedilmeliydi");
    }
}