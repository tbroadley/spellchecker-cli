import { constant, sumBy } from 'lodash';

export const hasMessages = (vfiles, filterMessages: (message) => boolean = constant(true)) => {
  const messageCount = sumBy(vfiles, (file: any) => file.messages.filter(filterMessages).length);
  return messageCount > 0;
};
