
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

/**
 * Determines whether a file path represents a rename operation.
 * A file path represents a rename operation if it contains ' => '.
 * @param fPath The file path to check.
 * @returns True if the file path represents a rename operation, false otherwise.
 */
export function isRename(fPath: string) {
    // if fPath contains ' => ' then it is a rename
    const pathParts = splitPathPartsForRename(fPath);
    return pathParts.length === 2;
}
function splitPathPartsForRename(fPath: string) {
    return fPath.split(' => ');
}
/**
 * Returns the path name of the file after the rename operation, removing data about the previous name.
 * If the file path does not represent a rename operation, it is returned as is.
 * EXAMPLES:
 * In case of rename the file path braces and '=>' (fat arrow) are used like in these examples:
 *
 * clients/src/main/java/org/apache/kafka/clients/admin/{DecommissionBrokerOptions.java => UnregisterBrokerOptions.java}
 * returns clients/src/main/java/org/apache/kafka/clients/admin/UnregisterBrokerOptions.java
 *
 * storage/src/main/java/org/apache/kafka/{server/log/internals => storage/internals/log}/EpochEntry.java
 * returns storage/src/main/java/org/apache/kafka/storage/internals/log/EpochEntry.java
 *
 * metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java
 * returns server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java
 *
 * {metadata/src/main/java/org/apache/kafka/controller => server-common/src/main/java/org/apache/kafka/deferred}/DeferredEvent.java
 * returns server-common/src/main/java/org/apache/kafka/deferred/DeferredEvent.java
 *
 * clients/src/main/java/org/apache/kafka/clients/{consumer/internals => }/StaleMetadataException.java
 * returns clients/src/main/java/org/apache/kafka/clients/StaleMetadataException.java
 *
 * @param fPath The file path to process.
 * @returns The path name of the file after the rename operation, removing data about the previous name.
 */
export function renamedFilePath(fPath: string) {
    if (isRename(fPath)) {
        const pathParts = splitPathPartsForRename(fPath);
        // manages the case where the rename is in the form of 'oldPath => newPath' with no braces like this:
        // metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java
        if (!pathParts[0].includes('{')) {
            // we expect no occurrences of '}' in the second part
            if (pathParts[1].includes('}')) {
                console.error(`ERROR: we found an '}' without an '{' in ${fPath}`);
                return fPath;
            }
            return pathParts[1];
        }
        const parts_0 = pathParts[0].split('{');
        const parts_1 = pathParts[1].split('}');
        // we expect only 1 occurrence of '{' in the first piece and only 1 occurrence of '}' in the second piece
        if (parts_0.length != 2 || parts_1.length != 2) {
            console.error(
                `ERROR: in case of rename there should be exactly one '{' and one '}' - instead found ${fPath}`
            );
            return fPath;
        }
        const firstPathPart = parts_0[0];
        // if the second part starts with a '/' then we need to remove it - example
        // clients/src/main/java/org/apache/kafka/clients/{consumer/internals => }/StaleMetadataException.java
        const secondPathPart = parts_1[0] === '' ? parts_1[1].slice(1) : parts_1[0] + parts_1[1];
        return firstPathPart + secondPathPart;
    }
    return fPath;
}
// beforeRenameFilePath is a function that takes the file path returned by git diff and returns the file path before the rename operation.
// If the file path does not represent a rename operation, it is returned as is.
// EXAMPLES:
// In case of rename the file path braces and '=>' (fat arrow) are used like in these examples:
//
// clients/src/main/java/org/apache/kafka/clients/admin/{DecommissionBrokerOptions.java => UnregisterBrokerOptions.java}
// returns clients/src/main/java/org/apache/kafka/clients/admin/DecommissionBrokerOptions.java
//
// storage/src/main/java/org/apache/kafka/{server/log/internals => storage/internals/log}/EpochEntry.java
// returns storage/src/main/java/org/apache/kafka/server/log/internals/EpochEntry.java
//
// metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java
// returns metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java
//
// {metadata/src/main/java/org/apache/kafka/controller => server-common/src/main/java/org/apache/kafka/deferred}/DeferredEvent.java
// returns metadata/src/main/java/org/apache/kafka/controller/DeferredEvent.java
//
// clients/src/main/java/org/apache/kafka/clients/{consumer/internals => }/StaleMetadataException.java
// returns clients/src/main/java/org/apache/kafka/clients/consumer/internals/StaleMetadataException.java
export function beforeRenameFilePath(fPath: string) {
    if (isRename(fPath)) {
        const pathParts = splitPathPartsForRename(fPath);
        // manages the case where the rename is in the form of 'oldPath => newPath' with no braces like this:
        // metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java
        if (!pathParts[0].includes('{')) {
            // we expect no occurrences of '}' in the second part
            if (pathParts[1].includes('}')) {
                console.error(`ERROR: we found an '}' without an '{' in ${fPath}`);
                return fPath;
            }
            return pathParts[0];
        }
        const parts_0 = pathParts[0].split('{');
        const parts_1 = pathParts[1].split('}');
        // we expect only 1 occurrence of '{' in the first piece and only 1 occurrence of '}' in the second piece
        if (parts_0.length != 2 || parts_1.length != 2) {
            console.error(
                `ERROR: in case of rename there should be exactly one '{' and one '}' - instead found ${fPath}`
            );
            return fPath;
        }
        const firstPathPart = parts_0[0];
        // if the second part starts with a '/' then we need to remove it - example
        // clients/src/main/java/org/apache/kafka/clients/{consumer/internals => }/StaleMetadataException.java
        const secondPathPart = parts_0[1] === '' ? parts_1[1].slice(1) : parts_0[1] + parts_1[1];
        return firstPathPart + secondPathPart;
    }
    return fPath;
}


//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
