import { useState } from 'react';
import { Upload, Button, message, Progress, List, Tag, Space, Dropdown, Modal } from 'antd';
import { InboxOutlined, UploadOutlined, CloudUploadOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';

interface DocumentUploaderProps {
  kbId: string;
  onUploadComplete?: (files: UploadFile[]) => void;
}

export function DocumentUploader({ kbId, onUploadComplete }: DocumentUploaderProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    accept: '.pdf,.docx,.pptx,.xlsx,.csv,.txt,.md,.html,.json,.xml',
    beforeUpload: (file) => {
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB
      if (!isValidSize) {
        message.error('文件大小不能超过100MB');
        return false;
      }
      return true;
    },
    onChange: (info) => {
      setFileList(info.fileList);
      
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
    onRemove: (file) => {
      setFileList(fileList.filter((item) => item.uid !== file.uid));
    },
    customRequest: ({ file, onSuccess, onError, onProgress }) => {
      // 模拟上传过程
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress >= 100) {
          clearInterval(interval);
          onSuccess?.(file);
        } else {
          onProgress?.({ percent: progress });
        }
      }, 200);
    },
  };

  const handleUpload = () => {
    setUploading(true);
    // 模拟上传所有文件
    setTimeout(() => {
      setUploading(false);
      message.success('所有文件上传完成');
      onUploadComplete?.(fileList);
    }, 2000);
  };

  return (
    <div>
      <Upload.Dragger {...uploadProps} style={{ marginBottom: 16 }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件至此处上传</p>
        <p className="ant-upload-hint">
          支持 PDF/DOCX/PPTX/XLSX/CSV/TXT/MD/HTML/JSON/XML 等格式
          <br />
          单文件上限 100MB，批量上传最多100个
        </p>
      </Upload.Dragger>

      {fileList.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>上传队列 ({fileList.filter(f => f.status === 'done').length}/{fileList.length})</span>
            <Button type="link" size="small" onClick={() => setFileList([])}>
              清空已完成
            </Button>
          </div>
          
          <List
            size="small"
            dataSource={fileList}
            renderItem={(file) => (
              <List.Item
                actions={[
                  file.status === 'error' && (
                    <Button type="link" size="small" icon={<ReloadOutlined />}>
                      重试
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ width: 32, textAlign: 'center' }}>
                      {file.status === 'uploading' && <UploadOutlined />}
                      {file.status === 'done' && <CloudUploadOutlined style={{ color: '#52c41a' }} />}
                      {file.status === 'error' && <DeleteOutlined style={{ color: '#ff4d4f' }} />}
                    </div>
                  }
                  title={
                    <Space>
                      <span>{file.name}</span>
                      <Tag color="blue">
                        {(file.size! / 1024 / 1024).toFixed(2)} MB
                      </Tag>
                    </Space>
                  }
                  description={
                    file.status === 'uploading' && file.percent ? (
                      <Progress percent={file.percent} size="small" />
                    ) : (
                      <span style={{ fontSize: 12, color: '#999' }}>
                        {file.status === 'done' && '上传完成'}
                        {file.status === 'uploading' && '上传中'}
                        {file.status === 'error' && '上传失败'}
                      </span>
                    )
                  }
                />
              </List.Item>
            )}
          />

          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleUpload}
            loading={uploading}
            disabled={fileList.length === 0}
            block
            style={{ marginTop: 16 }}
          >
            开始上传
          </Button>
        </div>
      )}
    </div>
  );
}