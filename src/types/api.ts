import { Response as ExpressResponse } from 'express';

export interface SuccessResponseBody {
    response: 'success';
}

/**
 * Type guard for the SuccessResponseBody type
 * @param {unknown} successResponseBody - object to type guard
 * @return {boolean} true if the successResponseBody is a SuccessResponseBody
 */
export function isSuccessResponseBody (successResponseBody: unknown): successResponseBody is SuccessResponseBody {
    return (successResponseBody as SuccessResponseBody).response === 'success';
}

export interface ErrorResponseBody {
    message: string;
}

/**
 * Type guard for the ErrorResponseBody type
 * @param {unknown} errorResponseBody - object to type guard
 * @return {boolean} true if the successResponseBody is a ErrorResponseBody
 */
export function isErrorResponseBody (errorResponseBody: unknown): errorResponseBody is ErrorResponseBody {
    return typeof (errorResponseBody as ErrorResponseBody).message === 'string';
}

export interface Response<T extends SuccessResponseBody = SuccessResponseBody> extends ExpressResponse<T | ErrorResponseBody> { }
