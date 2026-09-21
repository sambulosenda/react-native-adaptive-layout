module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['core', 'ios', 'android', 'example', 'docs', 'ci', 'deps', 'release', 'tooling'],
    ],
  },
};
