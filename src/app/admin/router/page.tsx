// src/app/admin/router/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RuleEditor from '@/components/RuleEditor';

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface RouterRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: any;
  targetModelId: string;
  description?: string;
  targetModel: Model;
  createdAt: string;
  updatedAt: string;
}

interface SystemConfig {
  routerMode: 'normal' | 'smart';
  defaultModel: string;
}

// 预设规则模板
const PRESET_TEMPLATES = {
  costOptimization: [
    {
      name: '超短文本（<500 tokens）',
      priority: 100,
      conditions: { tokenCount: { max: 500 } },
      description: '简单问答，使用最便宜的模型'
    },
    {
      name: '中等文本（500-2000 tokens）',
      priority: 90,
      conditions: { tokenCount: { min: 500, max: 2000 } },
      description: '一般对话，平衡成本和质量'
    },
    {
      name: '长文本（>2000 tokens）',
      priority: 80,
      conditions: { tokenCount: { min: 2000 } },
      description: '长文本分析，使用大上下文模型'
    }
  ],
  taskType: [
    {
      name: '代码生成',
      priority: 100,
      conditions: { hasCode: true },
      description: '代码任务，使用代码能力最强的模型'
    },
    {
      name: '多模态任务',
      priority: 95,
      conditions: { hasImages: true },
      description: '图片分析，使用视觉能力强的模型'
    },
    {
      name: '翻译任务',
      priority: 90,
      conditions: { taskType: 'translation' },
      description: '翻译任务，使用多语言能力强的模型'
    }
  ]
};

export default function RouterConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<SystemConfig>({ routerMode: 'normal', defaultModel: '' });
  const [rules, setRules] = useState<RouterRule[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<RouterRule | null>(null);
  const [testMessages, setTestMessages] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // 获取系统配置
      const configRes = await fetch('/api/admin/system/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data);
      }

      // 获取路由规则
      const rulesRes = await fetch('/api/admin/router/rules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules);
      }

      // 获取模型列表
      const modelsRes = await fetch('/api/admin/models', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (modelsRes.ok) {
        const data = await modelsRes.json();
        setModels(data.filter((m: any) => m.active));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/system/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        alert('配置已保存');
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/router/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ enabled })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('确定要删除这条规则吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/router/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const testRouter = async () => {
    try {
      const token = localStorage.getItem('token');
      const messages = JSON.parse(testMessages);
      
      const res = await fetch('/api/admin/router/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ messages })
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      } else {
        alert('测试失败');
      }
    } catch (error) {
      console.error('Failed to test router:', error);
      alert('测试失败：请检查 JSON 格式');
    }
  };

  const applyTemplate = async (template: any, targetModelId: string) => {
    if (!targetModelId) {
      alert('请先选择目标模型');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/router/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...template,
          targetModelId
        })
      });

      if (res.ok) {
        fetchData();
        alert('规则已创建');
      } else {
        alert('创建失败');
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      alert('创建失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">智能路由配置</h1>
          <p className="mt-1 text-xs text-gray-600">配置路由模式和规则，优化模型选择策略</p>
        </div>

        {/* 系统配置卡片 */}
        <div className="bg-white rounded-lg shadow p-3 mb-3">
          <h2 className="text-base font-semibold mb-2">系统配置</h2>
          
          <div className="space-y-4">
            {/* 路由模式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                路由模式
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="normal"
                    checked={config.routerMode === 'normal'}
                    onChange={(e) => setConfig({ ...config, routerMode: e.target.value as 'normal' })}
                    className="mr-2"
                  />
                  <span>普通模式（使用默认模型）</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="smart"
                    checked={config.routerMode === 'smart'}
                    onChange={(e) => setConfig({ ...config, routerMode: e.target.value as 'smart' })}
                    className="mr-2"
                  />
                  <span>智能路由（根据规则动态选择）</span>
                </label>
              </div>
            </div>

            {/* 默认模型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                默认模型
              </label>
              <select
                value={config.defaultModel}
                onChange={(e) => setConfig({ ...config, defaultModel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">请选择</option>
                {models.map((model) => (
                  <option key={model.id} value={model.name}>
                    {model.name} ({model.provider})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>

        {/* 路由规则列表 */}
        <div className="bg-white rounded-lg shadow p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-semibold">路由规则</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                📋 预设模板
              </button>
              <button
                onClick={() => {
                  setEditingRule(null);
                  setShowRuleEditor(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                + 新建规则
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">规则名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">优先级</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">目标模型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">条件</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                      {rule.description && (
                        <div className="text-xs text-gray-500">{rule.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.targetModel.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <pre className="text-xs max-w-xs overflow-auto">{JSON.stringify(rule.conditions, null, 2)}</pre>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleRule(rule.id, !rule.enabled)}
                        className={`px-2 py-1 text-xs rounded ${
                          rule.enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rule.enabled ? '启用' : '禁用'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setShowRuleEditor(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 路由测试器 */}
        <div className="bg-white rounded-lg shadow p-3">
          <h2 className="text-base font-semibold mb-2">路由测试器</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                测试消息（JSON 格式）
              </label>
              <textarea
                value={testMessages}
                onChange={(e) => setTestMessages(e.target.value)}
                placeholder='[{"role": "user", "content": "写一个 Python 函数"}]'
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              />
            </div>

            <button
              onClick={testRouter}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              测试路由
            </button>

            {testResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2">测试结果：</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>选择模型：</strong> {testResult.selectedModel}</div>
                  <div><strong>原因：</strong> {testResult.reason}</div>
                  <div><strong>Token 数：</strong> {testResult.features.tokenCount}</div>
                  <div><strong>消息数：</strong> {testResult.features.messageCount}</div>
                  <div><strong>任务类型：</strong> {testResult.features.taskType}</div>
                  <div><strong>复杂度：</strong> {testResult.features.complexity}</div>
                  {testResult.matchedRule && (
                    <div><strong>匹配规则：</strong> {testResult.matchedRule.name}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 规则编辑器 */}
      {showRuleEditor && (
        <RuleEditor
          rule={editingRule}
          models={models}
          onSave={() => {
            setShowRuleEditor(false);
            setEditingRule(null);
            fetchData();
          }}
          onCancel={() => {
            setShowRuleEditor(false);
            setEditingRule(null);
          }}
        />
      )}

      {/* 预设模板弹窗 */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">预设规则模板</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 成本优化模板 */}
              <div>
                <h4 className="font-semibold text-lg mb-3">成本优化模板</h4>
                <p className="text-sm text-gray-600 mb-4">根据 Token 数量选择不同价格的模型，降低成本</p>
                <div className="space-y-3">
                  {PRESET_TEMPLATES.costOptimization.map((template, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-600">{template.description}</div>
                        </div>
                        <div className="text-sm text-gray-500">优先级: {template.priority}</div>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        条件: {JSON.stringify(template.conditions)}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          id={`model-${index}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">选择目标模型</option>
                          {models.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} ({model.provider})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const select = document.getElementById(`model-${index}`) as HTMLSelectElement;
                            if (select.value) {
                              applyTemplate(template, select.value);
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          应用
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 任务类型模板 */}
              <div>
                <h4 className="font-semibold text-lg mb-3">任务类型模板</h4>
                <p className="text-sm text-gray-600 mb-4">根据任务类型选择专长模型</p>
                <div className="space-y-3">
                  {PRESET_TEMPLATES.taskType.map((template, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-600">{template.description}</div>
                        </div>
                        <div className="text-sm text-gray-500">优先级: {template.priority}</div>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        条件: {JSON.stringify(template.conditions)}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          id={`task-model-${index}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">选择目标模型</option>
                          {models.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} ({model.provider})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const select = document.getElementById(`task-model-${index}`) as HTMLSelectElement;
                            if (select.value) {
                              applyTemplate(template, select.value);
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          应用
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
