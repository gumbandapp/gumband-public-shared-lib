import { beforeEach, expect, describe, it, jest } from '@jest/globals';
import { PropertyAccessError, PropertyInvalidError, setPropertyValue } from './property';
import { HardwareRegistrationCache } from '../hardwareRegistrationCache';
import { ApiVersion, PropertyRegistration, V2PropertyType } from '../types';
import { MqttPublishFunc } from '../mqttEventHandler';


describe('setPropertyValue', () => {
    const cache = new HardwareRegistrationCache(false);
    let registration: PropertyRegistration;
    let mockMqttPublish: MqttPublishFunc;

    beforeEach(() => {
        cache.getMQTTAPIVersion = jest.fn(async () => {
            return 2 as ApiVersion;
        });

        cache.getProperty = jest.fn(async () => {
            return registration;
        });

        registration = {
            path: 'group/prop',
            index: 1,
            type: 'gmbnd_primitive' as V2PropertyType,
            format: 'i',
            length: 3,
            settable: true,
            gettable: true,
        };

        mockMqttPublish = jest.fn( async () => {});
    });

    it('publishes using mqttFunction if everything is good', async () => {
        await setPropertyValue(cache, '123', 'app', 'group/prop', [1, 2, 3], mockMqttPublish);
    });

    it('throws PropertyInvalidError if property does not exist', async () => {
        cache.getProperty = jest.fn(async () => {
            return undefined;
        });
        await expect(setPropertyValue(cache, '123', 'app', 'group/prop', [1, 2, 3], mockMqttPublish)).rejects.toThrow(PropertyInvalidError);
    });

    it('throws PropertyInvalidError if api version does not exist', async () => {
        cache.getMQTTAPIVersion = jest.fn(async () => {
            return undefined;
        });
        await expect(setPropertyValue(cache, '123', 'app', 'group/prop', [1, 2, 3], mockMqttPublish)).rejects.toThrow(PropertyInvalidError);
    });

    it('throws PropertyAccessError if property is not settable', async () => {
        registration.settable = false;
        await expect(setPropertyValue(cache, '123', 'app', 'group/prop', [1, 2, 3], mockMqttPublish)).rejects.toThrow(PropertyAccessError);
    });
});
