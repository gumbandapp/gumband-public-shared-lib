import { MqttClient } from 'mqtt';
import { validate } from 'uuid';
import { ApiVersion, V2DeviceCommandTopic } from '../types';
import { exhaustiveGuard } from './usefulTS';

/**
 * Validates the given component name
 *
 * @param {string} name - the unvalidated name sting
 * @throws an error object if the name is not a string or if the name is longer than 32 characters
 */
export const validateHardwareComponentName = (name: string) => {
    if (typeof name !== 'string') {
        throw new Error('name is not a string');
    }
    if (name === '') {
        throw new Error('name is an empty string');
    }
};

/**
 * Validates the given component v1 exhibitId
 *
 * @param {string | number} exhibitId - the unvalidated v1 exhibitId
 * @throws an error object if the exhibitId is not a positive integer or positive integer string
 * @return {number} exhibitId as a number (which is what is used for the v1 exhibit-management api)
 */
export const validateV1ExhibitId = (exhibitId: string | number): number => {
    if (typeof exhibitId === 'number' && exhibitId % 1 === 0 && exhibitId > 0) {
        return exhibitId;
    }
    if (typeof exhibitId === 'string' && exhibitId.match(/^[1-9]([0-9]?)+$/)) {
        return parseInt(exhibitId);
    }
    throw new Error('exhibitId is not a positive integer or positive integer string');
};

/**
 * Validates the given component v1 exhibitId for looking up a database query
 *
 * @param {string | number} exhibitId - the unvalidated v1 exhibitId
 * @throws an error object if the exhibitId is not a positive integer or positive integer string
 * @return {number} exhibitId as a number (which is what is used for the v1 exhibit-management api)
 */
export const validateV1ExhibitIdDatabase = (exhibitId: string | number): number => {
    if (typeof exhibitId === 'string' && exhibitId.match(/^[1-9]([0-9]?)+$/)) {
        return parseInt(exhibitId);
    }
    throw new Error('exhibitId is not a positive integer string');
};


/**
 * Validates the given component order
 *
 * @param {number} order - the unvalidated order
 * @throws an error object if the order is not a positive integer or zero
 */
export const validateHardwareComponentOrder = (order: number) => {
    if (!(typeof order === 'number' && order % 1 === 0 && order >= 0)) {
        throw new Error('order is not a positive integer or 0');
    }
};

/**
 * validates the given component ID
 *
 * @param {string} componentId  - the given componentId
 * @throws an error if the object isn't a valid UUID
 */
export const validateComponentId = (componentId: string) => {
    if (!validate(componentId)) {
        throw new Error('componentID is not a valid id');
    }
};


/**
 * Publishes a command to the hardware
 *
 * @param {MqttClient} client - MQTT client to publish to
 * @param {string} componentId - the component to publish the command to
 * @param {string} command - the command to trigger
 * @param {string} option - optional option value
 * @param {string} value - optional value value
 * @param {ApiVersion} apiVersion - which version of the mqtt api to use
 */
export const publishCommand = async (client: MqttClient, componentId: string, command: string, option: string | undefined = undefined, value: string | undefined = undefined, apiVersion: ApiVersion) => {
    let apiRoute = '';
    switch (apiVersion) {
        case 2:
            apiRoute = `${componentId}/${V2DeviceCommandTopic}`;
            break;
        default:
            exhaustiveGuard(apiVersion);
    }
    await client.publish(apiRoute, JSON.stringify({ command, option, value }));
};
