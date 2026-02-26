module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // import.meta.env → process.env 변환 (Zustand v5 웹 호환)
      function () {
        return {
          visitor: {
            MetaProperty(path) {
              const { node } = path;
              if (node.meta.name === 'import' && node.property.name === 'meta') {
                const parent = path.parentPath;
                if (
                  parent.isMemberExpression() &&
                  !parent.node.computed &&
                  parent.node.property.name === 'env'
                ) {
                  const t = require('@babel/types');
                  parent.replaceWith(
                    t.memberExpression(t.identifier('process'), t.identifier('env'))
                  );
                } else {
                  const t = require('@babel/types');
                  path.replaceWith(
                    t.objectExpression([
                      t.objectProperty(
                        t.identifier('env'),
                        t.memberExpression(t.identifier('process'), t.identifier('env'))
                      ),
                    ])
                  );
                }
              }
            },
          },
        };
      },
      require('react-native-css-interop/dist/babel-plugin').default,
      'react-native-reanimated/plugin',
    ],
  };
};
