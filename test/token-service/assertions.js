// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';

export const expectValidHash = (hash, len = 0) => {
  let regex;
  if (len && len > 0) {
    regex = new RegExp(`^0x[a-fA-F0-9]{${len}}$`);
  } else {
    regex = new RegExp(`^0x[a-fA-F0-9]*$`);
  }

  expect(!!hash.match(regex)).to.eq(true);
};
