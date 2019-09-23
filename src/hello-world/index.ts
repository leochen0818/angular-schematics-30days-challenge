import { Rule, SchematicContext, Tree, url, apply, template, mergeWith, SchematicsException, move } from '@angular-devkit/schematics';

import { strings } from '@angular-devkit/core';
import { parseName } from '@schematics/angular/utility/parse-name';
import { buildDefaultPath } from '@schematics/angular/utility/project';
import { validateName, validateHtmlSelector } from '@schematics/angular/utility/validation';
import { buildRelativePath, findModuleFromOptions, ModuleOptions } from '@schematics/angular/utility/find-module';
import { addDeclarationToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';

import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';

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
    
    validateName(name);
    validateHtmlSelector(`hello-${strings.dasherize(name)}`);
    
    const moduleOptions: ModuleOptions = { name: name, path: path };
    const modulePath = findModuleFromOptions(_tree, moduleOptions) || '';
    const sourceFile = ts.createSourceFile(
      'test.ts',
      (_tree.read(modulePath) || []).toString(),
      ts.ScriptTarget.Latest,
      true
    );

    const componentPath = `${path}/hello-${strings.dasherize(name)}.component`;
    const classifiedName = `Hello${strings.classify(name)}Component`;
    const relativePath = buildRelativePath(modulePath, componentPath);
    const declarationChanges = addDeclarationToModule(sourceFile, modulePath, classifiedName, relativePath);

    const declarationRecorder = _tree.beginUpdate(modulePath);
    for (const change of declarationChanges) {
      if (change instanceof InsertChange) {
        declarationRecorder.insertLeft(change.pos, change.toAdd);
      }
    }
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
