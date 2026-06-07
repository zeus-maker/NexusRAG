'use client'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function CreateKBDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>创建知识库</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>
              知识库名称 <span className="text-destructive">*</span>
            </Label>
            <Input placeholder="输入知识库名称（2-50 字符）" />
          </div>

          <div className="space-y-1.5">
            <Label>描述</Label>
            <Textarea placeholder="输入描述（选填，最多 200 字符）" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>默认语言</Label>
              <Select defaultValue="zh">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>默认分块策略</Label>
              <Select defaultValue="general">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">通用分块</SelectItem>
                  <SelectItem value="semantic">语义分块</SelectItem>
                  <SelectItem value="template">模板分块</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>嵌入模型</Label>
              <Select defaultValue="bge-m3">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bge-m3">BGE-M3</SelectItem>
                  <SelectItem value="bce">BCE-Embedding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>LLM 模型</Label>
              <Select defaultValue="deepseek">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deepseek">DeepSeek-v4</SelectItem>
                  <SelectItem value="qwen">Qwen3-72B</SelectItem>
                  <SelectItem value="claude">Claude-3.5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reranker 模型</Label>
            <Select defaultValue="bge-reranker">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bge-reranker">BGE-Reranker-v2-m3</SelectItem>
                <SelectItem value="bce-reranker">BCE-Reranker</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => onOpenChange(false)}>创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
