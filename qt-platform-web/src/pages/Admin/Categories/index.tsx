import { useState, useEffect, useCallback } from 'react';
import { Table, Space, Button, Modal, Form, Input, InputNumber, Card } from 'antd';
import { message } from '@/utils/antdUtils';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { categoryApi, adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';

type CategoryItem = {
  id: number;
  name: string;
  nameEn?: string;
  slug?: string;
  sortOrder?: number;
  icon?: string;
  children?: CategoryItem[];
};

type FlattenedCategory = CategoryItem & {
  depth: number;
};

type ApiResponse<T> = {
  data: T;
};

export default function AdminCategories() {
  const { t } = useTranslation();
  const [data, setData] = useState<FlattenedCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<FlattenedCategory | null>(null);
  const [form] = Form.useForm();

  const flattenCategories = useCallback((cats: CategoryItem[], depth = 0): FlattenedCategory[] => {
    const result: FlattenedCategory[] = [];
    for (const cat of cats) {
      result.push({ ...cat, depth });
      if (cat.children?.length) {
        result.push(...flattenCategories(cat.children, depth + 1));
      }
    }
    return result;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getAll() as ApiResponse<CategoryItem[]>;
      setData(flattenCategories(res.data || []));
    } catch { /* handled */ } finally { setLoading(false); }
  }, [flattenCategories]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalVisible(true); };
  const openEdit = (record: FlattenedCategory) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name, nameEn: record.nameEn, slug: record.slug, sortOrder: record.sortOrder, icon: record.icon });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields() as Partial<CategoryItem>;
    try {
      if (editing) {
        await adminApi.updateCategory(editing.id, values);
        message.success('Updated successfully');
      } else {
        await adminApi.createCategory(values);
        message.success('Created successfully');
      }
      setModalVisible(false);
      loadData();
    } catch { /* handled */ }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: t('admin.confirmDelete'),
      content: t('admin.cannotUndo'),
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.deleteCategory(id);
          message.success('Deleted successfully');
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const columns: ColumnsType<FlattenedCategory> = [
    { title: t('admin.id'), dataIndex: 'id', width: 60 },
    {
      title: t('admin.name'), dataIndex: 'name',
      render: (v: string, r) => <span style={{ paddingLeft: r.depth * 20 }} className="font-medium">{r.icon ? `${r.icon} ` : ''}{v}</span>,
    },
    { title: t('admin.englishName'), dataIndex: 'nameEn', ellipsis: true },
    { title: t('admin.slug'), dataIndex: 'slug', width: 140 },
    { title: t('admin.sortOrder'), dataIndex: 'sortOrder', width: 100 },
    {
      title: t('admin.action'), width: 150, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<Edit size={14} />} onClick={() => openEdit(record)} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.categories')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('admin.manageCategories')}</p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={openCreate} className="bg-blue-600">
          {t('admin.newCategory')}
        </Button>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading} 
          pagination={false} 
          scroll={{ x: 800 }} 
        />
      </Card>

      <Modal 
        title={editing ? t('admin.editCategory') : t('admin.newCategory')} 
        open={modalVisible}
        onOk={handleSave} 
        onCancel={() => setModalVisible(false)} 
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label={t('admin.name')} name="name" rules={[{ required: true, message: t('admin.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('admin.englishName')} name="nameEn"><Input /></Form.Item>
          <Form.Item label={t('admin.slug')} name="slug" rules={[{ required: true, message: t('admin.slugRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('admin.sortOrder')} name="sortOrder"><InputNumber min={0} className="w-full" /></Form.Item>
          <Form.Item label={t('admin.icon')} name="icon"><Input placeholder={t('admin.categoryIconPlaceholder')} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
