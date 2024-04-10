// Test to ensure that hardware commands exports
// the correct values


import { HARDWARE_COMMANDS, HARDWARE_ERRORS, HARDWARE_TEXT } from './HardwareCommands';

describe('HardwareCommands', () => {
    it('should have the correct values', () => {
        expect(HARDWARE_COMMANDS).toEqual({
            HOST: 'host',
            REBOOT: 'reboot',
            SLEEP: 'sleep',
            GET: 'get',
            DFU: 'dfu',
            CONTROL: 'control',
            IDENTIFY: 'identify',
            ERROR: 'error',
            ACKNOWLEDGE: 'acknowledge',
        });
        expect(HARDWARE_TEXT).toEqual({
            REQUEST: 'request',
        });
        expect(HARDWARE_ERRORS).toEqual({
            E_NO_HW_ID: 'E_NO_HW_ID',
            NOT_AUTHED: 'NOT_AUTHED',
        });
    });
});
