export type HandshakePayload = {
    jwt: string;
};

// There is no payload for this event, the event itself provides the information
export type HandshakeSuccessfulPayload = undefined;

export type SubscribeMultipleExhibitsPayload = {
    exhibits: Array<number>;
};

export type SubscribeMultipleHardwarePayload = {
    hardware: Array<number>;
};

export type UnsubscribeMultipleExhibitsPayload = {
    exhibits: Array<number>;
};

export type UnsubscribeMultipleHardwarePayload = {
    hardware: Array<number>;
};
