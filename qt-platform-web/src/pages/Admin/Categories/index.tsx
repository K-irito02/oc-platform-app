import { useState, useEffect } from 'react';
import { Table, Space, Button, message, Modal, Form, Input, InputNumber, Card } from 'antd';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { categoryApi, adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';

export default function AdminCategories() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await categoryApi.getAll();
      setData(flattenCategories(res.data));
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const flattenCategories = (cats: any[], depth = 0): any[] => {
    const result: any[] = [];
    for (const cat of cats) {
      result.push({ ...cat, depth });
      if (cat.children?.length) {
        result.push(...flattenCategories(cat.children, depth + 1));
      }
    }
    return result;
  };

  const openCreate = () => { setEditing(null); form.resetFields(); setModalVisible(true); };
  const openEdit = (record: any) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name, nameEn: record.nameEn, slug: record.slug, sortOrder: record.sortOrder, icon: record.icon });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
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
      title: 'Delete Category?',
      content: 'This action cannot be undone.',
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

  const columns: ColumnsType<any> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: 'Name', dataIndex: 'name',
      render: (v: string, r: any) => <span style={{ paddingLeft: r.depth * 20 }} className="font-medium">{r.icon ? `${r.icon} ` : ''}{v}</span>,
    },
    { title: 'English Name', dataIndex: 'nameEn', ellipsis: true },
    { title: 'Slug', dataIndex: 'slug', width: 140 },
    { title: 'Sort Order', dataIndex: 'sortOrder', width: 100 },
    {
      title: 'Action', width: 150, fixed: 'right',
      render: (_: any, record: any) => (
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
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage product category hierarchy.</p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={openCreate} className="bg-blue-600">
          New Category
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
        title={editing ? 'Edit Category' : 'New Category'} 
        open={modalVisible}
        onOk={handleSave} 
        onCancel={() => setModalVisible(false)} 
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="English Name" name="nameEn"><Input /></Form.Item>
          <Form.Item label="Slug" name="slug" rules={[{ required: true, message: 'Slug is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Sort Order" name="sortOrder"><InputNumber min={0} className="w-full" /></Form.Item>
          <Form.Item label="Icon" name="icon"><Input placeholder="Emoji or Icon Name" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
