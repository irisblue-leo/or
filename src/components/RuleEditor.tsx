// src/components/RuleEditor.tsx
'use client';

import { useState, useEffect } from 'react';

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface RouterRule {
  id?: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: any;
  targetModelId: string;
  description?: string;
}

interface RuleEditorProps {
  rule: RouterRule | null;
  models: Model[];
  onSave: () => void;
  onCancel: () => void;
}

export default function RuleEditor({ rule, models, onSave, onCancel }: RuleEditorProps) {
  const [form, setForm] = useState<RouterRule>({
    name: '',
    enabled: true,
    priority: 0,
    conditions: {},
    targetModelId: '',
    description: ''
  });

  const [conditions, setConditions] = useState({
    useTokenCount: false,
    tokenMin: 0,
    tokenMax: 1000,
    useMessageCount: false,
    messageMin: 1,
    messageMax: 10,
    hasImages: undefined as boolean | undefined,
    hasCode: undefined as boolean | undefined,
    taskType: '' as string,
    complexity: '' as string
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rule) {
      setForm(rule);
      
      // 解析 conditions
      const cond = rule.conditions || {};
      setConditions({
        useTokenCount: !!cond.tokenCount,
        tokenMin: cond.tokenCount?.min || 0,
        tokenMax: cond.tokenCount?.max || 1000,
        useMessageCount: !!cond.messageCount,
        messageMin: cond.messageCount?.min || 1,
        messageMax: cond.messageCount?.max || 10,
        hasImages: cond.hasImages,
        hasCode: cond.hasCode,
        taskType: cond.taskType || '',
        complexity: cond.complexity || ''
      });
    }
  }, [rule]);

  const buildConditions = () => {
    const result: any = {};

    if (conditions.useTokenCount) {
      result.tokenCount = {
        min: conditions.tokenMin,
        max: conditions.tokenMax
      };
    }

    if (conditions.useMessageCount) {
      result.messageCount = {
        min: conditions.messageMin,
        max: conditions.messageMax
      };
    }

    if (conditions.hasImages !== undefined) {
      result.hasImages = conditions.hasImages;
    }

    if (conditions.hasCode !== undefined) {
      result.hasCode = conditions.hasCode;
    }

    if (conditions.taskType) {
      result.taskType = conditions.taskType;
    }

    if (conditions.complexity) {
      result.complexity = conditions.complexity;
    }

    return result;
  };

  const handleSave = async () => {
    if (!form.name || !form.targetModelId) {
      alert('请填写规则名称和目标模型');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const finalConditions = buildConditions();

      const url = rule?.id 
        ? `/api/admin/router/rules/${rule.id}`
        : '/api/admin/router/rules';
      
      const method = rule?.id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          conditions: finalConditions
        })
      });

      if (res.ok) {
        onSave();
      } else {
        const data = await res.json();
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-semibold">
            {rule?.id ? '编辑规则' : '新建规则'}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">基本信息</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                规则名称 *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例如：短文本优化"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标模型 *
              </label>
              <select
                value={form.targetModelId}
                onChange={(e) => setForm({ ...form, targetModelId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">请选择模型</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                  placeholder="0-1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">数字越大优先级越高</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  状态
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span>启用规则</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                规则描述
              </label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="描述这条规则的用途"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* 匹配条件 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">匹配条件</h4>
            <p className="text-sm text-gray-600">选择至少一个条件，所有条件需同时满足才会匹配</p>

            {/* Token 数量 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={conditions.useTokenCount}
                  onChange={(e) => setConditions({ ...conditions, useTokenCount: e.target.checked })}
                  className="mr-2"
                />
                <span className="font-medium">Token 数量范围</span>
              </label>
              
              {conditions.useTokenCount && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">最小值</label>
                    <input
                      type="number"
                      value={conditions.tokenMin}
                      onChange={(e) => setConditions({ ...conditions, tokenMin: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">最大值</label>
                    <input
                      type="number"
                      value={conditions.tokenMax}
                      onChange={(e) => setConditions({ ...conditions, tokenMax: parseInt(e.target.value) || 1000 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 消息数量 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={conditions.useMessageCount}
                  onChange={(e) => setConditions({ ...conditions, useMessageCount: e.target.checked })}
                  className="mr-2"
                />
                <span className="font-medium">消息数量范围</span>
              </label>
              
              {conditions.useMessageCount && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">最小值</label>
                    <input
                      type="number"
                      value={conditions.messageMin}
                      onChange={(e) => setConditions({ ...conditions, messageMin: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">最大值</label>
                    <input
                      type="number"
                      value={conditions.messageMax}
                      onChange={(e) => setConditions({ ...conditions, messageMax: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 包含图片 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block font-medium mb-2">包含图片</label>
              <div className="flex gap-4 ml-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={conditions.hasImages === undefined}
                    onChange={() => setConditions({ ...conditions, hasImages: undefined })}
                    className="mr-2"
                  />
                  <span>不限</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={conditions.hasImages === true}
                    onChange={() => setConditions({ ...conditions, hasImages: true })}
                    className="mr-2"
                  />
                  <span>必须包含</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={conditions.hasImages === false}
                    onChange={() => setConditions({ ...conditions, hasImages: false })}
                    className="mr-2"
                  />
                  <span>不包含</span>
                </label>
              </div>
            </div>

            {/* 包含代码 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block font-medium mb-2">包含代码块</label>
              <div className="flex gap-4 ml-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={conditions.hasCode === undefined}
                    onChange={() => setConditions({ ...conditions, hasCode: undefined })}
                    className="mr-2"
                  />
                  <span>不限</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={conditions.hasCode === true}
                    onChange={() => setConditions({ ...conditions, hasCode: true })}
                    className="mr-2"
                  />
                  <span>必须包含</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={conditions.hasCode === false}
                    onChange={() => setConditions({ ...conditions, hasCode: false })}
                    className="mr-2"
                  />
                  <span>不包含</span>
                </label>
              </div>
            </div>

            {/* 任务类型 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block font-medium mb-2">任务类型</label>
              <select
                value={conditions.taskType}
                onChange={(e) => setConditions({ ...conditions, taskType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md ml-6"
              >
                <option value="">不限</option>
                <option value="chat">对话 (chat)</option>
                <option value="code">代码 (code)</option>
                <option value="analysis">分析 (analysis)</option>
                <option value="translation">翻译 (translation)</option>
                <option value="creative">创作 (creative)</option>
              </select>
            </div>

            {/* 复杂度 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block font-medium mb-2">复杂度</label>
              <select
                value={conditions.complexity}
                onChange={(e) => setConditions({ ...conditions, complexity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md ml-6"
              >
                <option value="">不限</option>
                <option value="simple">简单 (simple)</option>
                <option value="medium">中等 (medium)</option>
                <option value="complex">复杂 (complex)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存规则'}
          </button>
        </div>
      </div>
    </div>
  );
}
