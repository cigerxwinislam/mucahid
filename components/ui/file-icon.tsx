import {
  IconFileTypeCsv,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconMarkdown,
  IconPhoto,
} from '@tabler/icons-react';
import { File, FileJson, FileText } from 'lucide-react';
import type { FC } from 'react';

interface FileIconProps {
  type: string;
  size?: number;
}

export const FileIcon: FC<FileIconProps> = ({ type, size = 32 }) => {
  if (type.includes('image')) {
    return <IconPhoto size={size} />;
  } else if (type.includes('pdf')) {
    return <IconFileTypePdf size={size} />;
  } else if (type.includes('csv')) {
    return <IconFileTypeCsv size={size} />;
  } else if (type.includes('docx')) {
    return <IconFileTypeDocx size={size} />;
  } else if (type.includes('plain')) {
    return <FileText size={size} />;
  } else if (type.includes('json')) {
    return <FileJson size={size} />;
  } else if (type.includes('markdown')) {
    return <IconMarkdown size={size} />;
  } else {
    return <File size={size} />;
  }
};
