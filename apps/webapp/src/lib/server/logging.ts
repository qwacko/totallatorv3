import { createLogger, type LogClass, type Logger } from "@totallator/shared";

import { serverEnv } from "./serverEnv";

const config = {
  LOGGING: serverEnv.LOGGING,
  LOGGING_CLASSES: serverEnv.LOGGING_CLASSES as LogClass[],
};

export const logging: Logger = createLogger(config);

if (!serverEnv.TEST_ENV) {
  logging.info("Server Environment:", serverEnv);
}
