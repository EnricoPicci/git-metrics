"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const file_path_1 = require("./file-path");
describe(`renamedFilePath`, () => {
    it(`returns the file path for a commit path that does NOT represent a rename`, () => {
        const commitPath = 'clients/src/main/java/org/apache/kafka/clients/admin/KafkaAdminClient.java';
        const path = (0, file_path_1.renamedFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(commitPath);
    });
});
describe(`renamedFilePath in case of renames`, () => {
    // examples of renames
    //// clients/src/main/java/org/apache/kafka/clients/admin/{DecommissionBrokerOptions.java => UnregisterBrokerOptions.java}
    //// storage/src/main/java/org/apache/kafka/{server/log/internals => storage/internals/log}/EpochEntry.java
    //// metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java
    //// {metadata/src/main/java/org/apache/kafka/controller => server-common/src/main/java/org/apache/kafka/deferred}/DeferredEvent.java
    it(`returns the file path for a commit path that DOES represent a rename of just the file name`, () => {
        const commitPath = 'clients/src/main/java/org/apache/kafka/clients/admin/{DecommissionBrokerOptions.java => UnregisterBrokerOptions.java}';
        const expectedPath = 'clients/src/main/java/org/apache/kafka/clients/admin/UnregisterBrokerOptions.java';
        const path = (0, file_path_1.renamedFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
    it(`returns the file path for a commit path that DOES represent a rename of a subfolder`, () => {
        const commitPath = 'storage/src/main/java/org/apache/kafka/{server/log/internals => storage/internals/log}/EpochEntry.java';
        const expectedPath = 'storage/src/main/java/org/apache/kafka/storage/internals/log/EpochEntry.java';
        const path = (0, file_path_1.renamedFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
    it(`returns the file path for a commit path that DOES represent a rename of the entire path starting from the root`, () => {
        const commitPath = 'metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java';
        const expectedPath = 'server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java';
        const path = (0, file_path_1.renamedFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
    it(`returns the file path for a commit path that DOES represent a rename of the first part of the path`, () => {
        const commitPath = '{metadata/src/main/java/org/apache/kafka/controller => server-common/src/main/java/org/apache/kafka/deferred}/DeferredEvent.java';
        const expectedPath = 'server-common/src/main/java/org/apache/kafka/deferred/DeferredEvent.java';
        const path = (0, file_path_1.renamedFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
    it(`returns the file path for a commit path that DOES represent a rename with removal of a part of the path`, () => {
        const commitPath = 'clients/src/main/java/org/apache/kafka/clients/{consumer/internals => }/StaleMetadataException.java';
        const expectedPath = 'clients/src/main/java/org/apache/kafka/clients/StaleMetadataException.java';
        const path = (0, file_path_1.renamedFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
    it(`returns the file path for a commit path that DOES represent a rename with introduction of a part of the path`, () => {
        const commitPath = 'clients/src/main/java/{ => org/apache}/kafka/common/record/InvalidRecordException.java';
        const expectedPath = 'clients/src/main/java/org/apache/kafka/common/record/InvalidRecordException.java';
        const path = (0, file_path_1.renamedFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
});
describe(`beforeRenameFilePath in case of renames`, () => {
    // examples of renames
    //// clients/src/main/java/org/apache/kafka/clients/admin/{DecommissionBrokerOptions.java => UnregisterBrokerOptions.java}
    //// storage/src/main/java/org/apache/kafka/{server/log/internals => storage/internals/log}/EpochEntry.java
    //// metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java
    //// {metadata/src/main/java/org/apache/kafka/controller => server-common/src/main/java/org/apache/kafka/deferred}/DeferredEvent.java
    it(`returns the original file path (i.e. before a rename) for a path that DOES represent a rename of just the file name`, () => {
        const commitPath = 'clients/src/main/java/org/apache/kafka/clients/admin/{DecommissionBrokerOptions.java => UnregisterBrokerOptions.java}';
        const expectedPath = 'clients/src/main/java/org/apache/kafka/clients/admin/DecommissionBrokerOptions.java';
        const path = (0, file_path_1.beforeRenameFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
    it(`returns the original file path (i.e. before a rename) for a path that DOES represent a rename of a subfolder`, () => {
        const commitPath = 'storage/src/main/java/org/apache/kafka/{server/log/internals => storage/internals/log}/EpochEntry.java';
        const expectedPath = 'storage/src/main/java/org/apache/kafka/server/log/internals/EpochEntry.java';
        const path = (0, file_path_1.beforeRenameFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
    it(`returns the original file path (i.e. before a rename) for a path that DOES represent a rename of 
    the entire path starting from the root`, () => {
        const commitPath = 'metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java';
        const expectedPath = 'metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java';
        const path = (0, file_path_1.beforeRenameFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
    it(`returns the original file path (i.e. before a rename) for a path that DOES represent a rename of the first part of the path`, () => {
        const commitPath = '{metadata/src/main/java/org/apache/kafka/controller => server-common/src/main/java/org/apache/kafka/deferred}/DeferredEvent.java';
        const expectedPath = 'metadata/src/main/java/org/apache/kafka/controller/DeferredEvent.java';
        const path = (0, file_path_1.beforeRenameFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
    it(`returns the original file path (i.e. before a rename) for a path that DOES represent a rename with removal of a part of the path`, () => {
        const commitPath = 'clients/src/main/java/org/apache/kafka/clients/{consumer/internals => }/StaleMetadataException.java';
        const expectedPath = 'clients/src/main/java/org/apache/kafka/clients/consumer/internals/StaleMetadataException.java';
        const path = (0, file_path_1.beforeRenameFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
    it(`returns the original file path (i.e. before a rename) for a that DOES represent a rename with introduction of a part of the path`, () => {
        const commitPath = 'clients/src/main/java/{ => org/apache}/kafka/common/record/InvalidRecordException.java';
        const expectedPath = 'clients/src/main/java/kafka/common/record/InvalidRecordException.java';
        const path = (0, file_path_1.beforeRenameFilePath)(commitPath);
        (0, chai_1.expect)(path).equal(expectedPath);
    });
});
//# sourceMappingURL=file-path.spec.js.map