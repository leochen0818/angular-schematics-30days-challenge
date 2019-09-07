import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('hello-world', () => {
  const expectResult = (fileName?: string) => {
    const fullFileName = `/${fileName || 'hello'}`;
    const params = fileName ? { name: fileName } : {};
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('hello-world', params, Tree.empty())
    expect(tree.files).toContain(fullFileName);
    expect(tree.readContent(fullFileName)).toEqual('world');
  }

  it('使用者沒給檔名，則檔名為 "/hello"，檔案內容為 "world"', () => {
    expectResult();
  });
  it('使用者有給檔名，則檔名為使用者給的檔名，檔案內容為 "world"', () => {
    expectResult('Leo');
  });
});
