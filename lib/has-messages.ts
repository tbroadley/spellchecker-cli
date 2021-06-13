import constant from 'lodash/constant';
import sumBy from 'lodash/sumBy';

export const hasMessages = (vfiles: any, filterMessages: any = constant(true)) => {
  const messageCount = sumBy(vfiles, (file: any) => file.messages.filter(filterMessages).length);
  return messageCount > 0;
};
