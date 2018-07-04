import { constant, sumBy } from 'lodash';

export const hasMessages = (vfiles, filterMessages = constant(true)) => {
  const messageCount = sumBy(vfiles, file => file.messages.filter(filterMessages).length);
  return messageCount > 0;
};
