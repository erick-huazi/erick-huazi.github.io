import assert from 'node:assert/strict';
import Fuse from 'fuse.js/basic';
import { createQuickSearch } from '../src/quick-search.mjs';
const search = createQuickSearch([
  {id:'worldcup',title:'World Cup AI Forecast',description:'AI 赛事数据产品',aliases:'世界杯 足球 赛事 预测 worldcup forecast'},
  {id:'astrrot',title:'Astrrot 星萝塔罗',description:'AI 陪伴产品',aliases:'星萝 塔罗 情绪 日记 tarot'},
  {id:'contact',title:'微信、电话与邮箱',description:'ErickX1024 联系合作',aliases:'联系方式 手机 邮件 17621988864 email'},
  {id:'service',title:'合作方向',description:'AI 应用 自动化 运营',aliases:'智能体 agent workflow 工作流 FDE 咨询'}
], Fuse);
assert.deepEqual(search('世界杯').map(x=>x.id), ['worldcup']);
assert.deepEqual(search('电话').map(x=>x.id), ['contact']);
assert.deepEqual(search(' ＡＩ  赛事 ').map(x=>x.id), ['worldcup']);
assert.equal(search('worlcup')[0].id, 'worldcup');
assert.equal(search('worlcup')[0].approximate, true);
assert.equal(search('astrrt')[0].id, 'astrrot');
assert.equal(search('workflw')[0].id, 'service');
assert.equal(search('没有这个项目').length, 0);
assert.equal(search('xyzq').length, 0);
assert.equal(search('世').length, 1);
assert.equal(search('')[0].id, 'worldcup');
assert.deepEqual(search('AI').map(x=>x.id), ['worldcup','astrrot','service']);
console.log('12 search assertions passed: Chinese, fullwidth, multiword, Latin typo, irrelevant query and stable order.');
