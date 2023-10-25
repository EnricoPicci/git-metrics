
export function isUnknownRevisionError(error: any) {
    return error.message.includes('unknown revision or path not in the working tree')
}
export const ERROR_UNKNOWN_REVISION_OR_PATH = {
    name: 'ErrorUnknownParent',
    message: 'Unknown revision or path - not in the working tree',
};
