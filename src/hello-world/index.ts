import { Rule, SchematicContext, Tree, url, apply, template, mergeWith, SchematicsException, move } from '@angular-devkit/schematics';

import { strings } from '@angular-devkit/core';
import { parseName } from '@schematics/angular/utility/parse-name';
import { buildDefaultPath } from '@schematics/angular/utility/project';

import * as ts from 'typescript';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function helloWorld(_options: HelloWorldSchema): Rule {
  return async (_tree: Tree, _context: SchematicContext) => {

    const workspaceConfigBuffer = _tree.read('angular.json');
    if ( !workspaceConfigBuffer ) {
      throw new SchematicsException('Not an Angular CLI workspace');
    }

    const workspaceConfig = JSON.parse(workspaceConfigBuffer.toString());
    const projectName = _options.project || workspaceConfig.defaultProject;
    const project = workspaceConfig.projects[projectName];
    const defaultProjectPath = buildDefaultPath(project);
    const parsePath = parseName(defaultProjectPath, _options.name);
    const { name, path } = parsePath;
    
    let importPath = '';
    if ( path === defaultProjectPath ) {
      importPath = './';
    } else {
      importPath = path.replace(defaultProjectPath, '.') + '/';
    }
    importPath += 'hello-' + strings.dasherize(name) + '.component';
    
    const appModulePath = `.${defaultProjectPath}/app.module.ts`;
    const text = _tree.read(appModulePath) || [];
    
    let sourceFile = ts.createSourceFile(
      'test.ts',
      text.toString(),
      ts.ScriptTarget.Latest,
      true
    );

    const classDeclaration = sourceFile.statements.find( node => ts.isClassDeclaration(node) )! as ts.ClassDeclaration;
    const decorator = classDeclaration.decorators![0] as ts.Decorator;
    const callExpression = decorator.expression as ts.CallExpression;
    const objectLiteralExpression = callExpression.arguments[0] as ts.ObjectLiteralExpression;
    const propertyAssignment = objectLiteralExpression.properties.find((property: ts.PropertyAssignment) => {
      return (property.name as ts.Identifier).text === 'declarations'
    })! as ts.PropertyAssignment;
    const arrayLiteralExpression = propertyAssignment.initializer as ts.ArrayLiteralExpression;
    const identifier = arrayLiteralExpression.elements[0] as ts.Identifier;

    const declarationRecorder = _tree.beginUpdate(appModulePath);
    const changeText = identifier.getFullText(sourceFile);
    const classifyName = strings.classify(name);
    const componentName = `Hello${classifyName}Component`;
    let toInsert = '';
    if (changeText.match(/^\r?\r?\n/)) {
      toInsert = `,${changeText.match(/^\r?\n\s*/)![0]}${componentName}`;
    } else {
      toInsert = `, ${componentName}`;
    }
    declarationRecorder.insertLeft(identifier.end, toInsert);

    const allImports = sourceFile.statements.filter( node => ts.isImportDeclaration(node) )! as ts.ImportDeclaration[];
    let lastImport: ts.Node | undefined;
    for (const importNode of allImports) {
      if ( !lastImport || importNode.getStart() > lastImport.getStart() ) {
        lastImport = importNode;
      }
    }
    const importStr = `\nimport { ${componentName} } from '${importPath}';`;
    declarationRecorder.insertLeft(lastImport!.end, importStr);

    _tree.commitUpdate(declarationRecorder);
    
    const sourceTemplates = url('./files');
    const sourceParametrizedTemplates = apply(sourceTemplates, [
      template({
        ..._options,
        ...strings,
        name
      }),
      move(path)
    ]);

    return mergeWith(sourceParametrizedTemplates);
  };
}
