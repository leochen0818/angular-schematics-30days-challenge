import { Rule, SchematicContext, Tree, url, apply, template, mergeWith, SchematicsException, move } from '@angular-devkit/schematics';

import { strings } from '@angular-devkit/core';
import { parseName } from '@schematics/angular/utility/parse-name';
import { buildDefaultPath } from '@schematics/angular/utility/project';

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
