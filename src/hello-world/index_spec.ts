import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { strings } from '@angular-devkit/core';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('hello-world', () => {
  it('成功產出檔案，則檔名為/hello-leo-chen.component.ts', () => {
    const name = 'LeoChen';
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('hello-world', { name: name }, Tree.empty())

    const dasherizeName = strings.dasherize(name);
    const fullFileName = `/hello-${dasherizeName}.component.ts`;
    expect(tree.files).toContain(fullFileName);
    
    const fileContent = tree.readContent(fullFileName);
    expect(fileContent).toMatch(/hello-leo-chen/);
    expect(fileContent).toMatch(/HelloLeoChenComponent/);
  });
});
