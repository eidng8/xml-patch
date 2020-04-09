/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      '@babel/preset-typescript',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
};
