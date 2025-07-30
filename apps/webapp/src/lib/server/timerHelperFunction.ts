import { logging } from "./logging";

export const timerHelperFunction = (title: string) => {
  const startTime = Date.now();

  return {
    end: () => {
      const endTime = Date.now();
      logging.debug(`${title} took ${endTime - startTime}ms`);
    },
  };
};
