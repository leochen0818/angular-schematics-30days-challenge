import { Rule, SchematicContext, Tree, SchematicsException } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { buildDefaultPath } from '@schematics/angular/utility/project';
import { addImportToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';

import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';

export default function (_options: NgAddSchema): Rule {
  return (_tree: Tree, _context: SchematicContext) => {

    const workspaceConfigBuffer = _tree.read('angular.json');
    if ( !workspaceConfigBuffer ) {
      throw new SchematicsException('Not an Angular CLI workspace');
    }

    const workspaceConfig = JSON.parse(workspaceConfigBuffer.toString());
    const projectName = _options.project || workspaceConfig.defaultProject;
    const project = workspaceConfig.projects[projectName];
    const defaultProjectPath = buildDefaultPath(project);
    
    // 第三步
    const modulePath = `${defaultProjectPath}/app.module.ts`;
    const sourceFile = readIntoSourceFile(_tree, modulePath);

    const importPath = '@fortawesome/angular-fontawesome';
    const moduleName = 'FontAwesomeModule';
    const declarationChanges = addImportToModule(sourceFile, modulePath, moduleName, importPath);

    const declarationRecorder = _tree.beginUpdate(modulePath);
    for (const change of declarationChanges) {
      if (change instanceof InsertChange) {
        declarationRecorder.insertLeft(change.pos, change.toAdd);
      }
    }
    _tree.commitUpdate(declarationRecorder);

    // 第四步

    const componentPath = `${defaultProjectPath}/app.component.ts`;
    const componentSourceFile = readIntoSourceFile(_tree, componentPath);
    const allImports = componentSourceFile.statements.filter( node => ts.isImportDeclaration(node) )! as ts.ImportDeclaration[];

    let lastImport: ts.Node | undefined;
    for (const importNode of allImports) {
      if ( !lastImport || importNode.getStart() > lastImport.getStart() ) {
        lastImport = importNode;
      }
    }
  
    const classDeclaration = componentSourceFile.statements.find( node => ts.isClassDeclaration(node) )! as ts.ClassDeclaration;
    const allProperties = classDeclaration.members.filter( node => ts.isPropertyDeclaration(node) )! as ts.PropertyDeclaration[];

    let lastProperty: ts.Node | undefined;
    for (const propertyNode of allProperties) {
      if ( !lastProperty || propertyNode.getStart() > propertyNode.getStart() ) {
        lastProperty = propertyNode;
      }
    }

    const componentRecorder = _tree.beginUpdate(componentPath);

    const importFaCoffee = '\nimport { faCoffee } from \'@fortawesome/free-solid-svg-icons\';';
    componentRecorder.insertLeft(lastImport!.end, importFaCoffee);

    const faCoffeeProperty= 'faCoffee = faCoffee;'
    const changeText = lastProperty ? lastProperty.getFullText() : '';
    let toInsert = '';
    if (changeText.match(/^\r?\r?\n/)) {
      toInsert = `${changeText.match(/^\r?\n\s*/)![0]}${faCoffeeProperty}`;
    } else {
      toInsert = `\n  ${faCoffeeProperty}\n`;
    }

    if (lastProperty) {
      componentRecorder.insertLeft(lastProperty!.end, toInsert);
    } else {
      componentRecorder.insertLeft(classDeclaration.end - 1, toInsert);
    }

    _tree.commitUpdate(componentRecorder);

    const htmlPath = `${defaultProjectPath}/app.component.html`;
    const htmlStr = `\n<fa-icon [icon]="faCoffee"></fa-icon>\n`;
    const htmlSourceFile = readIntoSourceFile(_tree, htmlPath);
    const htmlRecorder = _tree.beginUpdate(htmlPath);
    htmlRecorder.insertLeft(htmlSourceFile.end, htmlStr);
    _tree.commitUpdate(htmlRecorder);

    // 第二步
    const dependencies = [
      { name: '@fortawesome/fontawesome-svg-core', version: '~1.2.25' },
      { name: '@fortawesome/free-solid-svg-icons', version: '~5.11.2' },
      { name: '@fortawesome/angular-fontawesome', version: '~0.5.0' }
    ];
    dependencies.forEach(dependency => {
      addPackageToPackageJson(
        _tree,
        dependency.name,
        dependency.version
      );
    });

    _context.addTask(
      new NodePackageInstallTask({
        packageName: dependencies.map(d => d.name).join(' ')
      })
    );

    return _tree;
  };
}

function readIntoSourceFile(host: Tree, modulePath: string): ts.SourceFile {
  const text = host.read(modulePath);
  if (text === null) {
    throw new SchematicsException(`File ${modulePath} does not exist.`);
  }
  const sourceText = text.toString('utf-8');
  return ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
}

export function addPackageToPackageJson(host: Tree, pkg: string, version: string): Tree {
  if (host.exists('package.json')) {
    const sourceText = host.read('package.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);
    if (!json.dependencies) {
      json.dependencies = {};
    }
    if (!json.dependencies[pkg]) {
      json.dependencies[pkg] = version;
      json.dependencies = sortObjectByKeys(json.dependencies);
    }
    host.overwrite('package.json', JSON.stringify(json, null, 2));
  }
  return host;
}

function sortObjectByKeys(obj: any) {
  return Object.keys(obj).sort().reduce((result, key) => (result[key] = obj[key]) && result, {} as any);
}
