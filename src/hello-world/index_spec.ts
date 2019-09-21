import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as ApplicationOptions, Style } from '@schematics/angular/application/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('hello-world', () => {
  const runner = new SchematicTestRunner('schematics', collectionPath);
  const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '6.0.0',
  };
  const appOptions: ApplicationOptions = {
    name: 'hello',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: Style.Css,
    skipTests: false,
    skipPackageJson: false,
  };
  const defalutOptions: HelloWorldSchema = { 
    name: 'feature/Leo Chen' 
  };

  let appTree: UnitTestTree;

  beforeEach(async () => {
    appTree = await runner.runExternalSchematicAsync(
      '@schematics/angular',
      'workspace',
      workspaceOptions
    ).toPromise();
    appTree = await runner.runExternalSchematicAsync(
      '@schematics/angular',
      'application',
      appOptions,
      appTree
    ).toPromise();
  });

  it('成功在預設專案路徑底下產出 Component，並將其加到 AppModule 的 declarations 裡', async () => {
    const options: HelloWorldSchema = { ...defalutOptions };
    const tree = await runner.runSchematicAsync('hello-world', options, appTree).toPromise();
    expect(tree.files).toContain('/projects/hello/src/app/feature/hello-leo-chen.component.ts');
    
    const moduleContent = tree.readContent('/projects/hello/src/app/app.module.ts');
    expect(moduleContent).toMatch(/import.*HelloLeoChen.*from '.\/feature\/hello-leo-chen.component'/);
    expect(moduleContent).toMatch(/declarations:\s*\[[^\]]+?,\r?\n\s+HelloLeoChenComponent\r?\n/m);
  });
  it('成功在 "world" 專案路徑底下產出 Component，並將其加到 AppModule 的 declarations 裡', async () => {
    appTree = await runner.runExternalSchematicAsync(
      '@schematics/angular',
      'application',
      { ...appOptions, name: 'world' },
      appTree
    ).toPromise();
    const options: HelloWorldSchema = { ...defalutOptions, project: 'world' };
    const tree = await runner.runSchematicAsync('hello-world', options, appTree).toPromise();
    expect(tree.files).toContain('/projects/world/src/app/feature/hello-leo-chen.component.ts');

    const moduleContent = tree.readContent('/projects/world/src/app/app.module.ts');
    expect(moduleContent).toMatch(/import.*HelloLeoChen.*from '.\/feature\/hello-leo-chen.component'/);
    expect(moduleContent).toMatch(/declarations:\s*\[[^\]]+?,\r?\n\s+HelloLeoChenComponent\r?\n/m);
  });
});
