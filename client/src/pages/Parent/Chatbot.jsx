// client/src/pages/Parent/Chatbot.jsx

import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    IconButton,
    Avatar,
    Stack,
    CircularProgress,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    useTheme,
    useMediaQuery,
    Menu,
    MenuItem,
    Fade,
    InputAdornment,
} from '@mui/material';
import {
    Send as SendIcon,
    Person as PersonIcon,
    Add as AddIcon,
    Chat as ChatIcon,
    Delete as DeleteIcon,
    MoreVert as MoreIcon,
    AutoAwesome as SparkleIcon,
    History as HistoryIcon,
} from '@mui/icons-material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { chatbotApi } from '~/apis/chatbotApi';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import chatbot_Ai from '/chatbot_Ai.png';

// ✅ ADD: Import Markdown renderer
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function Chatbot() {
    const { user } = useUser();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedConvId, setSelectedConvId] = useState(null);

    const messagesEndRef = useRef(null);
    const { showConfirm, dialogState, handleCancel } = useConfirmDialog();

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, sending]);

    useEffect(() => {
        if (isMobile && currentConversation) {
            setDrawerOpen(false);
        }
    }, [currentConversation, isMobile]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const res = await chatbotApi.getAllConversations();
            // Khớp với res.status(StatusCodes.OK).json({ data: result })
            setConversations(res.data.data);
        } catch (error) {
            toast.error('Không thể tải danh sách cuộc trò chuyện');
        }
    };

    const handleCreateConversation = async () => {
        try {
            const res = await chatbotApi.createConversation();
            const newConv = res.data.data;
            setConversations([newConv, ...conversations]);
            setCurrentConversation(newConv);
            setMessages([]);
            toast.success('Khởi tạo phiên tư vấn mới!');
        } catch (error) {
            toast.error('Lỗi khi tạo phiên trò chuyện');
        }
    };

    const handleSelectConversation = async (conv) => {
        try {
            const res = await chatbotApi.getConversationDetails(conv._id);
            const details = res.data.data;
            setCurrentConversation(details);
            setMessages(details.messages || []);
        } catch (error) {
            toast.error('Không thể tải nội dung tin nhắn');
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || sending) return;

        const messageContent = inputMessage.trim();
        try {
            setSending(true);
            setInputMessage('');

            // UI Update: Thêm tin nhắn user ngay lập tức
            const userMsg = { role: 'user', content: messageContent, timestamp: new Date() };
            setMessages((prev) => [...prev, userMsg]);

            // Call API: Khớp field { conversationId, message }
            const res = await chatbotApi.sendMessage({
                conversationId: currentConversation._id,
                message: messageContent,
            });

            // Nhận kết quả từ AI: Khớp field res.data.data.answer (hoặc content)
            const aiMsg = {
                role: 'assistant',
                content: res.data.data.answer || res.data.data.content,
                timestamp: res.data.data.timestamp || new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);

            // Cập nhật lại danh sách hội thoại để đưa cái mới nhất lên đầu
            fetchConversations();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'AI đang bận, vui lòng thử lại sau');
        } finally {
            setSending(false);
        }
    };

    const handleDeleteConversation = (convId) => {
        showConfirm({
            title: 'Xóa lịch sử trò chuyện?',
            message: 'Toàn bộ nội dung tư vấn này sẽ bị xóa vĩnh viễn.',
            onConfirm: async () => {
                try {
                    await chatbotApi.deleteConversation(convId);
                    setConversations((prev) => prev.filter((c) => c._id !== convId));
                    if (currentConversation?._id === convId) {
                        setCurrentConversation(null);
                        setMessages([]);
                    }
                    toast.success('Đã xóa thành công');
                } catch (error) {
                    toast.error('Không thể xóa hội thoại');
                }
            },
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleMenuOpen = (event, convId) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedConvId(convId);
    };

    const sidebarContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
            <Box sx={{ p: 2, background: '#4facfe', color: 'white' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <SparkleIcon fontSize="small" />
                    <Typography variant="h6" fontWeight={700} letterSpacing={0.5}>
                        Trợ lý AI SmartKindly
                    </Typography>
                </Stack>
                <ListItemButton
                    onClick={handleCreateConversation}
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                        transition: '0.3s',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 35 }}>
                        <AddIcon sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText primary="Tạo hội thoại mới" primaryTypographyProps={{ fontWeight: 700 }} />
                </ListItemButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontWeight: 600 }}>
                    Lịch sử hỏi đáp
                </Typography>
                <List>
                    {conversations.map((conv) => (
                        <ListItem key={conv._id} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                selected={currentConversation?._id === conv._id}
                                onClick={() => handleSelectConversation(conv)}
                                sx={{
                                    borderRadius: 2,
                                    mx: 1,
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.lighter',
                                        color: 'primary.main',
                                        '&:hover': { bgcolor: 'primary.lighter' },
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <ChatIcon
                                        fontSize="small"
                                        color={currentConversation?._id === conv._id ? 'primary' : 'inherit'}
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary={conv.conversationName}
                                    secondary={dayjs(conv.lastMessageAt).format('HH:mm, DD/MM')}
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600, noWrap: true }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                                <IconButton size="small" onClick={(e) => handleMenuOpen(e, conv._id)}>
                                    <MoreIcon fontSize="inherit" />
                                </IconButton>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Box>
    );

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb items={[{ text: 'Trợ lý AI SmartKindly' }]} />

                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        height: 'calc(100vh - 160px)',
                        display: 'flex',
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                    }}
                >
                    {/* Sidebar Desktop */}
                    {!isMobile && (
                        <Box sx={{ width: 320, borderRight: '1px solid', borderColor: 'divider' }}>
                            {sidebarContent}
                        </Box>
                    )}

                    {/* Main Chat Area */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fbfcfe' }}>
                        {currentConversation ? (
                            <>
                                {/* Chat Header */}
                                <Box
                                    sx={{
                                        p: 2,
                                        px: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        bgcolor: '#fff',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    {isMobile && (
                                        <IconButton onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
                                            <HistoryIcon />
                                        </IconButton>
                                    )}
                                    <Avatar
                                        src={chatbot_Ai} // ✅ Thêm src ảnh vào đây
                                        sx={{
                                            bgcolor: 'transparent', // ✅ Đổi nền thành trong suốt để ảnh PNG hiển thị đẹp
                                            width: 40,
                                            height: 40,
                                            mr: 2,
                                        }}
                                    ></Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={700}>
                                            {currentConversation.conversationName}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="success.main"
                                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: 'currentColor',
                                                }}
                                            />{' '}
                                            AI Trợ lý trực tuyến
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* ✅ Messages Area with Markdown */}
                                <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
                                    <Stack spacing={2.5}>
                                        {messages.map((msg, index) => (
                                            <Fade in key={index}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                                            maxWidth: '85%',
                                                            gap: 1.5,
                                                        }}
                                                    >
                                                        <Avatar
                                                            src={msg.role === 'user' ? undefined : chatbot_Ai} // ✅ Nếu là bot thì dùng ảnh chatbot_Ai
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                bgcolor:
                                                                    msg.role === 'user'
                                                                        ? 'primary.main'
                                                                        : 'transparent', // ✅ Bot thì nền trong suốt
                                                                fontSize: '1rem',
                                                            }}
                                                        >
                                                            {msg.role === 'user' ? (
                                                                <PersonIcon fontSize="inherit" />
                                                            ) : (
                                                                // ✅ Nếu Avatar src không chạy (do lỗi load), fallback này sẽ hiện
                                                                // Nhưng thường MUI ưu tiên src, bạn có thể để trống hoặc dùng thẻ img
                                                                <img
                                                                    src={chatbot_Ai}
                                                                    alt="AI"
                                                                    style={{ width: '100%', height: '100%' }}
                                                                />
                                                            )}
                                                        </Avatar>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Paper
                                                                sx={{
                                                                    p: 2,
                                                                    borderRadius: 3,
                                                                    bgcolor:
                                                                        msg.role === 'user' ? 'primary.main' : '#fff',
                                                                    color:
                                                                        msg.role === 'user' ? '#fff' : 'text.primary',
                                                                    borderTopRightRadius: msg.role === 'user' ? 0 : 16,
                                                                    borderTopLeftRadius: msg.role === 'user' ? 16 : 0,
                                                                    boxShadow:
                                                                        msg.role === 'user'
                                                                            ? '0 4px 12px rgba(25, 118, 210, 0.2)'
                                                                            : '0 2px 8px rgba(0,0,0,0.05)',
                                                                }}
                                                            >
                                                                {/* ✅ Render Markdown for AI responses */}
                                                                {msg.role === 'assistant' ? (
                                                                    <ReactMarkdown
                                                                        remarkPlugins={[remarkGfm]}
                                                                        components={{
                                                                            // ✅ Custom styles for Markdown elements
                                                                            p: ({ children }) => (
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        lineHeight: 1.7,
                                                                                        mb: 1,
                                                                                        '&:last-child': { mb: 0 },
                                                                                    }}
                                                                                >
                                                                                    {children}
                                                                                </Typography>
                                                                            ),
                                                                            strong: ({ children }) => (
                                                                                <Box
                                                                                    component="strong"
                                                                                    sx={{
                                                                                        fontWeight: 700,
                                                                                        color: 'primary.main',
                                                                                    }}
                                                                                >
                                                                                    {children}
                                                                                </Box>
                                                                            ),
                                                                            ul: ({ children }) => (
                                                                                <Box
                                                                                    component="ul"
                                                                                    sx={{ pl: 2, mb: 1 }}
                                                                                >
                                                                                    {children}
                                                                                </Box>
                                                                            ),
                                                                            ol: ({ children }) => (
                                                                                <Box
                                                                                    component="ol"
                                                                                    sx={{ pl: 2, mb: 1 }}
                                                                                >
                                                                                    {children}
                                                                                </Box>
                                                                            ),
                                                                            li: ({ children }) => (
                                                                                <Typography
                                                                                    component="li"
                                                                                    variant="body2"
                                                                                    sx={{ mb: 0.5, lineHeight: 1.6 }}
                                                                                >
                                                                                    {children}
                                                                                </Typography>
                                                                            ),
                                                                            h1: ({ children }) => (
                                                                                <Typography
                                                                                    variant="h5"
                                                                                    fontWeight={700}
                                                                                    sx={{ mb: 1, mt: 1 }}
                                                                                >
                                                                                    {children}
                                                                                </Typography>
                                                                            ),
                                                                            h2: ({ children }) => (
                                                                                <Typography
                                                                                    variant="h6"
                                                                                    fontWeight={600}
                                                                                    sx={{ mb: 1, mt: 1 }}
                                                                                >
                                                                                    {children}
                                                                                </Typography>
                                                                            ),
                                                                            code: ({ children }) => (
                                                                                <Box
                                                                                    component="code"
                                                                                    sx={{
                                                                                        bgcolor: 'grey.100',
                                                                                        color: 'error.main',
                                                                                        px: 0.5,
                                                                                        py: 0.25,
                                                                                        borderRadius: 0.5,
                                                                                        fontFamily: 'monospace',
                                                                                        fontSize: '0.9em',
                                                                                    }}
                                                                                >
                                                                                    {children}
                                                                                </Box>
                                                                            ),
                                                                            blockquote: ({ children }) => (
                                                                                <Box
                                                                                    component="blockquote"
                                                                                    sx={{
                                                                                        borderLeft: '4px solid',
                                                                                        borderColor: 'primary.main',
                                                                                        pl: 2,
                                                                                        py: 0.5,
                                                                                        my: 1,
                                                                                        bgcolor: 'grey.50',
                                                                                        fontStyle: 'italic',
                                                                                    }}
                                                                                >
                                                                                    {children}
                                                                                </Box>
                                                                            ),
                                                                        }}
                                                                    >
                                                                        {msg.content}
                                                                    </ReactMarkdown>
                                                                ) : (
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{ lineHeight: 1.6 }}
                                                                    >
                                                                        {msg.content}
                                                                    </Typography>
                                                                )}
                                                            </Paper>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    mt: 0.5,
                                                                    display: 'block',
                                                                    px: 1,
                                                                    color: 'text.disabled',
                                                                    textAlign: msg.role === 'user' ? 'right' : 'left',
                                                                }}
                                                            >
                                                                {dayjs(msg.timestamp).format('HH:mm')}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Fade>
                                        ))}
                                        {sending && (
                                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                <Avatar
                                                    src={chatbot_Ai} // ✅ Dùng ảnh
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: 'transparent', // ✅ Nền trong suốt
                                                    }}
                                                />
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 3,
                                                        bgcolor: '#fff',
                                                        borderTopLeftRadius: 0,
                                                    }}
                                                >
                                                    Đợi xíu
                                                    <CircularProgress size={18} thickness={5} />
                                                </Paper>
                                            </Box>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </Stack>
                                </Box>

                                {/* Input Area */}
                                <Box
                                    sx={{
                                        p: 2,
                                        px: { xs: 2, md: 4 },
                                        bgcolor: '#fff',
                                        borderTop: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    <TextField
                                        fullWidth
                                        placeholder="Hỏi AI về tình hình của bé..."
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        disabled={sending}
                                        spellCheck={false} // Tắt gạch chân đỏ
                                        InputProps={{
                                            sx: { borderRadius: 4, pr: 1, bgcolor: '#f8fafc' },
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={handleSendMessage}
                                                        disabled={!inputMessage.trim() || sending}
                                                        sx={{
                                                            bgcolor: 'primary.main',
                                                            color: '#fff',
                                                            '&:hover': { bgcolor: 'primary.dark' },
                                                            '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                                                        }}
                                                    >
                                                        <SendIcon fontSize="small" />
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                                        AI SmartKindly có thể đưa ra câu trả lời dựa trên dữ liệu học tập và sinh hoạt
                                        của bé tại trường.
                                    </Typography>
                                </Box>
                            </>
                        ) : (
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 4,
                                    textAlign: 'center',
                                }}
                            >
                                <Box sx={{ position: 'relative', mb: 4 }}>
                                    <Avatar
                                        src={chatbot_Ai} // ✅ Dùng ảnh lớn
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            bgcolor: 'transparent', // ✅ Nền trong suốt hoặc màu nhạt tùy thiết kế
                                            // color: 'primary.main', // Không cần color nữa vì dùng ảnh gốc
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 10,
                                            right: 10,
                                            bgcolor: 'success.main',
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            border: '4px solid #fff',
                                        }}
                                    />
                                </Box>
                                <Typography variant="h5" fontWeight={700} gutterBottom>
                                    Chatbot AI Trợ Lý dành cho Phụ Huynh
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 450, mb: 4 }}>
                                    Chào bạn! Tôi có thể giúp gì cho bạn.
                                </Typography>
                                <ListItemButton
                                    onClick={handleCreateConversation}
                                    sx={{
                                        maxWidth: 280,
                                        borderRadius: 8,
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                        py: 1.5,
                                        px: 4,
                                    }}
                                >
                                    <Typography fontWeight={700}>Bắt đầu hỏi đáp ngay</Typography>
                                </ListItemButton>
                            </Box>
                        )}
                    </Box>

                    {/* Mobile Drawer */}
                    <Drawer anchor="left" open={drawerOpen && isMobile} onClose={() => setDrawerOpen(false)}>
                        <Box sx={{ width: 300 }}>{sidebarContent}</Box>
                    </Drawer>
                </Paper>

                {/* Dropdown Menu for Deletion */}
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                    <MenuItem
                        onClick={() => {
                            handleDeleteConversation(selectedConvId);
                            setAnchorEl(null);
                        }}
                    >
                        <DeleteIcon fontSize="small" color="error" sx={{ mr: 1 }} />
                        <Typography color="error" variant="body2" fontWeight={600}>
                            Xóa hội thoại này
                        </Typography>
                    </MenuItem>
                </Menu>

                <ConfirmDialog {...dialogState} onCancel={handleCancel} />
            </PageContainer>
        </MainLayout>
    );
}

export default Chatbot;
