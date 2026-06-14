import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  FileText,
  Target,
  Package,
  Coins,
  Lightbulb,
  Building2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useProposalStore } from '@/store/useProposalStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { extractKeywords } from '@/utils/recommend';

interface FormData {
  title: string;
  description: string;
  expectedBenefit: string;
  resources: string;
  estimatedCost: string;
  department: string;
}

const departments = ['研发部', '市场部', '运营部', '人力资源部', '财务部'];

export default function NewProposal() {
  const navigate = useNavigate();
  const { createProposal, updateProposal, recommendDepartments, findSimilarCases } = useProposalStore();
  const { createApproval, determineApprovalLevel, getApprovalThreshold } = useApprovalStore();
  const { currentUser, getUsersByRole } = useAuthStore();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    expectedBenefit: '',
    resources: '',
    estimatedCost: '',
    department: currentUser?.department || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const recommendedDepts = useMemo(() => {
    if (!formData.title && !formData.description) return [];
    const depts = recommendDepartments(formData.title, formData.description);
    const allText = `${formData.title} ${formData.description} ${formData.expectedBenefit} ${formData.resources}`;
    const keywords = extractKeywords(allText, 10);

    const departmentKeywordMap: Record<string, string[]> = {
      研发部: ['开发', '研发', '技术', '系统', '平台', 'AI', '算法', '数据', 'App', '性能', 'DevOps'],
      市场部: ['营销', '市场', '品牌', '推广', '用户增长', '裂变', '活动', 'VI', '数据看板', 'BI'],
      运营部: ['运营', '用户', '客户', '供应链', '采购', '物流', '库存', '客户生命周期', 'CRM'],
      人力资源部: ['培训', 'HR', '人力', '招聘', '福利', '员工', '年会', '人才', '学习'],
      财务部: ['财务', '预算', '报销', '成本', '会计', '税务', '审计', '采购'],
    };

    return depts.map((dept) => {
      let matchCount = 0;
      const deptKeywords = departmentKeywordMap[dept] || [];
      for (const kw of keywords) {
        if (deptKeywords.some((dkw) => dkw.includes(kw) || kw.includes(dkw))) {
          matchCount++;
        }
      }
      const matchRate = keywords.length > 0 ? Math.min(95, Math.round((matchCount / Math.max(keywords.length, 3)) * 100) + 30) : 50;
      return { name: dept, matchRate };
    }).sort((a, b) => b.matchRate - a.matchRate);
  }, [formData.title, formData.description, formData.expectedBenefit, formData.resources, recommendDepartments]);

  const similarCases = useMemo(() => {
    if (!formData.title && !formData.description) return [];
    return findSimilarCases(formData.title, formData.description);
  }, [formData.title, formData.description, findSimilarCases]);

  const approvalLevel = useMemo(() => {
    const cost = parseFloat(formData.estimatedCost) || 0;
    return cost > 0 ? determineApprovalLevel(cost) : null;
  }, [formData.estimatedCost, determineApprovalLevel]);

  const approvalThreshold = getApprovalThreshold();

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入提案标题';
    }
    if (!formData.description.trim()) {
      newErrors.description = '请输入提案描述';
    }
    if (!formData.expectedBenefit.trim()) {
      newErrors.expectedBenefit = '请输入预期收益';
    }
    if (!formData.resources.trim()) {
      newErrors.resources = '请输入所需资源';
    }
    if (!formData.estimatedCost || parseFloat(formData.estimatedCost) <= 0) {
      newErrors.estimatedCost = '请输入有效的预估成本';
    }
    if (!formData.department) {
      newErrors.department = '请选择所属部门';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSaveDraft = async () => {
    if (!currentUser) return;
    setIsSaving(true);

    try {
      createProposal({
        title: formData.title || '未命名提案',
        description: formData.description,
        expectedBenefit: formData.expectedBenefit,
        resources: formData.resources,
        estimatedCost: parseFloat(formData.estimatedCost) || 0,
        department: formData.department || currentUser.department,
        submitterId: currentUser.id,
      });
      navigate('/proposals');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || !validateForm()) return;
    setIsSubmitting(true);

    try {
      const cost = parseFloat(formData.estimatedCost);
      const proposal = createProposal({
        title: formData.title,
        description: formData.description,
        expectedBenefit: formData.expectedBenefit,
        resources: formData.resources,
        estimatedCost: cost,
        department: formData.department,
        submitterId: currentUser.id,
      });

      updateProposal(proposal.id, { status: 'pending' });

      const level = determineApprovalLevel(cost);
      const approvers = getUsersByRole(level === 'manager' ? 'manager' : 'committee');
      if (approvers.length > 0) {
        createApproval(proposal, approvers[0].id, level);
      }

      navigate(`/proposals/${proposal.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (recommendedDepts.length > 0 && !formData.department) {
      setFormData((prev) => ({ ...prev, department: recommendedDepts[0].name }));
    }
  }, [recommendedDepts]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/proposals')}
          className="btn btn-ghost"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">新建提案</h1>
          <p className="text-neutral-500 mt-1">提交您的创意想法</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="space-y-5">
              <div>
                <label className="label">
                  <FileText className="w-4 h-4 inline mr-1.5 text-primary-500" />
                  提案标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="简洁明了地描述您的创意"
                  className={cn('input', errors.title && 'border-red-400 focus:ring-red-500/20 focus:border-red-500')}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>

              <div>
                <label className="label">
                  <Lightbulb className="w-4 h-4 inline mr-1.5 text-accent-500" />
                  提案描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="详细描述您的创意方案、背景和解决的问题..."
                  className={cn('textarea', errors.description && 'border-red-400 focus:ring-red-500/20 focus:border-red-500')}
                />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
              </div>

              <div>
                <label className="label">
                  <Target className="w-4 h-4 inline mr-1.5 text-warning-500" />
                  预期收益 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.expectedBenefit}
                  onChange={(e) => handleChange('expectedBenefit', e.target.value)}
                  placeholder="描述该提案实施后能带来的具体收益，如降本增效、用户增长等"
                  className={cn('textarea', errors.expectedBenefit && 'border-red-400 focus:ring-red-500/20 focus:border-red-500')}
                />
                {errors.expectedBenefit && <p className="mt-1 text-xs text-red-500">{errors.expectedBenefit}</p>}
              </div>

              <div>
                <label className="label">
                  <Package className="w-4 h-4 inline mr-1.5 text-primary-500" />
                  所需资源 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.resources}
                  onChange={(e) => handleChange('resources', e.target.value)}
                  placeholder="描述需要的人力、设备、时间等资源支持"
                  className={cn('textarea', errors.resources && 'border-red-400 focus:ring-red-500/20 focus:border-red-500')}
                />
                {errors.resources && <p className="mt-1 text-xs text-red-500">{errors.resources}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">
                    <Coins className="w-4 h-4 inline mr-1.5 text-accent-500" />
                    预估成本（元） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedCost}
                    onChange={(e) => handleChange('estimatedCost', e.target.value)}
                    placeholder="请输入预估金额"
                    className={cn('input', errors.estimatedCost && 'border-red-400 focus:ring-red-500/20 focus:border-red-500')}
                  />
                  {errors.estimatedCost && <p className="mt-1 text-xs text-red-500">{errors.estimatedCost}</p>}
                  {formData.estimatedCost && parseFloat(formData.estimatedCost) > 0 && (
                    <div className="mt-2 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                        <div className="text-xs text-neutral-600">
                          <p className="font-medium text-neutral-700">审批流程说明</p>
                          <p className="mt-1">
                            金额 ≤ ¥{approvalThreshold.toLocaleString()}：部门经理直接审批
                          </p>
                          <p>
                            金额 {'>'} ¥{approvalThreshold.toLocaleString()}：部门经理初审 → 创新委员会终审
                          </p>
                          <p className="mt-1.5 text-primary-600 font-medium">
                            当前提案将由：{approvalLevel === 'manager' ? '部门经理' : approvalLevel === 'committee' ? '创新委员会' : '—'} 审批
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">
                    <Building2 className="w-4 h-4 inline mr-1.5 text-warning-500" />
                    所属部门 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className={cn('input', errors.department && 'border-red-400 focus:ring-red-500/20 focus:border-red-500')}
                  >
                    <option value="">请选择部门</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || isSubmitting}
              className="btn btn-secondary"
            >
              <Save className="w-4 h-4" />
              {isSaving ? '保存中...' : '保存草稿'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || isSubmitting}
              className="btn btn-primary"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? '提交中...' : '提交审批'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-neutral-800">智能推荐</h3>
            </div>

            <div className="mb-5">
              <p className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary-500" />
                关联部门推荐
              </p>
              {recommendedDepts.length === 0 ? (
                <p className="text-sm text-neutral-400">请先输入标题或描述以获取推荐</p>
              ) : (
                <div className="space-y-2">
                  {recommendedDepts.map((dept) => (
                    <div
                      key={dept.name}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-lg border transition-all',
                        formData.department === dept.name
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-neutral-100 bg-neutral-50 hover:border-neutral-200'
                      )}
                    >
                      <span className="text-sm font-medium text-neutral-700">{dept.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                            style={{ width: `${dept.matchRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-neutral-500 w-8 text-right">
                          {dept.matchRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-accent-500" />
                相似案例参考
              </p>
              {similarCases.length === 0 ? (
                <p className="text-sm text-neutral-400">输入更多内容以查找相似案例</p>
              ) : (
                <div className="space-y-2.5">
                  {similarCases.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-neutral-100 bg-neutral-50 hover:border-neutral-200 transition-all"
                    >
                      <p className="text-sm font-medium text-neutral-800 line-clamp-1">{item.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-neutral-500">{item.department}</span>
                        <span className="text-xs text-neutral-300">·</span>
                        <span
                          className={cn(
                            'badge text-xs',
                            item.result === 'success' ? 'badge-success' : 'badge-error'
                          )}
                        >
                          {item.result === 'success' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {item.result === 'success' ? '成功' : '失败'}
                        </span>
                        <span className="text-xs text-neutral-400 ml-auto">匹配 {item.matchRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
