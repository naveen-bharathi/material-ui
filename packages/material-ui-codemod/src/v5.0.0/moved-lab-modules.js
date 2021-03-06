const movedLabModules = [
  'Alert',
  'AlertTitle',
  'Autocomplete',
  'AvatarGroup',
  'Pagination',
  'Rating',
  'Skeleton',
  'SpeedDial',
  'SpeedDialAction',
  'SpeedDialIcon',
  'ToggleButton',
  'ToggleButtonGroup',
  'useAutocomplete',
];

/**
 * @param {import('jscodeshift').FileInfo} file
 * @param {import('jscodeshift').API} api
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.ImportDeclaration)
    .forEach((path) => {
      const importSouce = path.node.source.value;
      const subPackageImportMatch = importSouce.match(/@material-ui\/lab\/(.*)/);
      if (subPackageImportMatch !== null) {
        const componentName = subPackageImportMatch[1];

        if (movedLabModules.includes(componentName)) {
          /**
           * @type {import('jscodeshift').ASTPath}
           */
          const sourcePath = path.get('source');
          sourcePath.replace(j.stringLiteral(`@material-ui/core/${componentName}`));
        }
      } else if (importSouce === '@material-ui/lab') {
        // Sieve import specifiers into /core and /lab
        const labImportSpecifiers = [];
        const coreImportSpecifiers = [];
        path.node.specifiers.forEach((specifier) => {
          if (specifier.type === 'ImportSpecifier') {
            if (movedLabModules.includes(specifier.imported.name)) {
              coreImportSpecifiers.push(specifier);
            } else {
              labImportSpecifiers.push(specifier);
            }
          } else {
            // `import Lab from '@material-ui/lab'`
            // `import * as Lab from '@material-ui/lab'`
            // These imports would require scope analysis.
            console.warn(`Can't handle ${specifier.type}`);
          }
        });

        if (coreImportSpecifiers.length > 0) {
          path.replace(
            j.importDeclaration(coreImportSpecifiers, j.stringLiteral('@material-ui/core')),
            j.importDeclaration(labImportSpecifiers, j.stringLiteral('@material-ui/lab')),
          );
        }
      }
    })
    .toSource();
}
