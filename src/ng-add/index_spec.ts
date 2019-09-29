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

  it('成功在預設專案路徑底下新增Font-awesome', async () => {
    const tree = await runner.runSchematicAsync('ng-add', {}, appTree).toPromise();
    const moduleContent = tree.readContent('/projects/hello/src/app/app.module.ts');
    expect(moduleContent).toMatch(/import.*FontAwesomeModule.*from '@fortawesome\/angular-fontawesome'/);
    expect(moduleContent).toMatch(/imports:\s*\[[^\]]+?,\r?\n\s+FontAwesomeModule\r?\n/m);

    const componentContent = tree.readContent('/projects/hello/src/app/app.component.ts');
    expect(componentContent).toMatch(/import.*faCoffee.*from '@fortawesome\/free-solid-svg-icons'/);
    expect(componentContent).toContain('faCoffee = faCoffee;');

    const htmlContent = tree.readContent('/projects/hello/src/app/app.component.html');
    expect(htmlContent).toContain('<fa-icon [icon]="faCoffee"></fa-icon>');

    const packageJson = JSON.parse(tree.readContent('/package.json'));
    const dependencies = packageJson.dependencies;
    expect(dependencies['@fortawesome/fontawesome-svg-core']).toBeDefined();
    expect(dependencies['@fortawesome/free-solid-svg-icons']).toBeDefined();
    expect(dependencies['@fortawesome/angular-fontawesome']).toBeDefined();

    expect(runner.tasks.some(task => task.name === 'node-package')).toBe(true);
  });
  it('成功在 "world" 專案路徑底下新增 Font-awesome', async () => {
    appTree = await runner.runExternalSchematicAsync(
      '@schematics/angular',
      'application',
      { ...appOptions, name: 'world' },
      appTree
    ).toPromise();
    const options: NgAddSchema = { project: 'world' };
    const tree = await runner.runSchematicAsync('ng-add', options, appTree).toPromise();
    const moduleContent = tree.readContent('/projects/world/src/app/app.module.ts');
    expect(moduleContent).toMatch(/import.*FontAwesomeModule.*from '@fortawesome\/angular-fontawesome'/);
    expect(moduleContent).toMatch(/imports:\s*\[[^\]]+?,\r?\n\s+FontAwesomeModule\r?\n/m);

    const componentContent = tree.readContent('/projects/world/src/app/app.component.ts');
    expect(componentContent).toMatch(/import.*faCoffee.*from '@fortawesome\/free-solid-svg-icons'/);
    expect(componentContent).toContain('faCoffee = faCoffee;');

    const htmlContent = tree.readContent('/projects/world/src/app/app.component.html');
    expect(htmlContent).toContain('<fa-icon [icon]="faCoffee"></fa-icon>');

    const packageJson = JSON.parse(tree.readContent('/package.json'));
    const dependencies = packageJson.dependencies;
    expect(dependencies['@fortawesome/fontawesome-svg-core']).toBeDefined();
    expect(dependencies['@fortawesome/free-solid-svg-icons']).toBeDefined();
    expect(dependencies['@fortawesome/angular-fontawesome']).toBeDefined();

    expect(runner.tasks.some(task => task.name === 'node-package')).toBe(true);
  });
});
