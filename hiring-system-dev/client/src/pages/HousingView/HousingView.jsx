import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { selectHousingByTitle } from '../../store/housingSlice/housing.selectors';
import CloseIcon from '@mui/icons-material/Close';
import {
    Breadcrumbs,
    Button,
    Card,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Pagination,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { getReportList, postNewReport } from '../../store/housingSlice/housing.thunk';
import ChatBox from '../../components/ChatBox';
import { pageChange } from '../../store/housingSlice/housing.slice';

const HousingView = ({ parent }) => {
    const navigate = useNavigate();
    const [housing, setHousing] = useState(null);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const title = queryParams.get('title');

    const house = useSelector(selectHousingByTitle(title));
    const { housingAssignment } = useSelector((state) => state.profile.info);
    const houseId = house?._id || housingAssignment?._id;

    useEffect(() => {
        if (parent === 'hr' && title) {
            // Use the selector to find the housing item by title
            setHousing(house);
        } else if (parent === 'employee') {
            setHousing(housingAssignment);
        }
    }, [parent]);

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <section>
            {parent === 'hr' && (
                <Breadcrumbs aria-label='breadcrumb' sx={{ margin: '16px 0' }}>
                    <Link underline='hover' color='inherit' onClick={handleGoBack} sx={{ cursor: 'pointer' }}>
                        Go Back
                    </Link>
                    <Typography sx={{ color: 'text.primary' }}>Housing Detail</Typography>
                </Breadcrumbs>
            )}
            {housing ? (
                <div className='flex-col g-1'>
                    <HousingDetail housing={housing} parent={parent}/>
                    <HousingFaicilityReport houseId={houseId} parent={parent} />
                </div>
            ) : (
                <div>Housing item not found.</div>
            )}
        </section>
    );
};

const HousingDetail = ({ parent, housing }) => {
    return (
        <div className='housing-detail outlined-container'>
            <header>
                <h1 className='title'>{housing.title}</h1>
            </header>
            <Typography variant='h5' sx={{ m: '1rem 0', borderBottom: '1px solid #aaa' }}>
                Facility Information
            </Typography>
            <Card className='view-container' sx={{ p: '1rem' }}>
                <label className='view-item'>
                    Beds<span>{housing?.facilityInfo?.beds}</span>
                </label>
                <label className='view-item'>
                    Mattresses
                    <span>{housing?.facilityInfo?.mattresses}</span>
                </label>
                <label className='view-item'>
                    Tables<span>{housing?.facilityInfo?.tables}</span>
                </label>
                <label className='view-item'>
                    Chairs<span>{housing?.facilityInfo?.chairs}</span>
                </label>
            </Card>
            <Typography variant='h5' sx={{ m: '1rem 0', borderBottom: '1px solid #aaa' }}>
                Address
            </Typography>
            <Card className='view-container' sx={{ p: '1rem' }}>
                <label className='view-item'>
                    Building/Apartment #<span>{housing?.address?.buildingOrAptNumber}</span>
                </label>
                <label className='view-item'>
                    Street
                    <span>{housing?.address?.street}</span>
                </label>
                <label className='view-item'>
                    City<span>{housing?.address?.city}</span>
                </label>
                <label className='view-item'>
                    State<span>{housing?.address?.state}</span>
                </label>
                <label className='view-item'>
                    Zipcode<span>{housing?.address?.zip}</span>
                </label>
            </Card>
            <Typography variant='h5' sx={{ m: '1rem 0', borderBottom: '1px solid #aaa' }}>
                Landlord
            </Typography>
            <Card className='view-container' sx={{ p: '1rem' }}>
                <label className='view-item'>
                    Landloard Legal Full Name
                    <span>{housing?.landlord?.name}</span>
                </label>
                <label className='view-item'>
                    Landloard Phone Number
                    <span>{housing?.landlord?.phone}</span>
                </label>
                <label className='view-item'>
                    Landloard Email Address
                    <span>{housing?.landlord?.email}</span>
                </label>
            </Card>
            <Typography variant='h5' sx={{ m: '1rem 0', borderBottom: '1px solid #aaa' }}>
                Residents
            </Typography>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Email</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {housing.residents.length ? (
                            housing.residents.map((row) => (
                                <TableRow key={row._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell component='th' scope='row'>
                                        {parent === 'hr' ? (
                                            <Link to={`/hr/employee-profile?username=${row.username}`} style={{textDecoration: "underline"}}>
                                                {row.preferredName || row.firstName} {row.lastName}
                                            </Link>
                                        ) : (
                                            `${row.preferredName || row.firstName} ${row.lastName}`
                                        )}
                                    </TableCell>
                                    <TableCell>{row.phone}</TableCell>
                                    <TableCell>{row.email}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow sx={{ textAlign: 'center' }}>
                                <TableCell colSpan={5} align='center'>
                                    No residents
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

const HousingFaicilityReport = ({ houseId, parent }) => {
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [selectedReport, setSelectedReport] = useState(null); // store the selected report for comments
    const [chatboxOpen, setChatboxOpen] = useState(false);
    const { facilityReports, page, limit, totalPages, totalReports } = useSelector(
        (state) => state.housing.reportsInfo
    );

    const getHouseReport = async () => {
        const config = { page, limit, houseId };
        await dispatch(getReportList(config));
    };

    useEffect(() => {
        getHouseReport();
    }, [page]);

    const handleCommentButtonClick = async (reportId) => {
        try {
            const response = await fetch(`http://localhost:5000/v1/api/housing/report/${reportId}`, {
                headers: {
                    Authorization: `Bearer ${document.cookie.split('token=')[1]}`,
                },
                credentials: 'include',
            });

            if (response.ok) {
                const updatedReport = await response.json();
                setSelectedReport(updatedReport);
                setChatboxOpen(true);
            } else {
                console.error('Error fetching report:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching report:', error);
        }
    };

    const handleAddComment = async (newComment) => {
        try {
            const response = await fetch(`http://localhost:5000/v1/api/housing/report/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${document.cookie.split('token=')[1]}`,
                },
                body: JSON.stringify({
                    reportId: selectedReport._id,
                    description: newComment,
                }),
                credentials: 'include',
            });

            if (response.ok) {
                const updatedReportResponse = await fetch(
                    `http://localhost:5000/v1/api/housing/report/${selectedReport._id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${document.cookie.split('token=')[1]}`,
                        },
                        credentials: 'include',
                    }
                );

                const updatedReport = await updatedReportResponse.json();
                setSelectedReport(updatedReport);
            } else {
                console.error('Error saving comment:', response.statusText);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleSubmit = async () => {
        const config = { limit, houseId, ...formData };
        await dispatch(postNewReport(config));
        setFormData({});
        setOpen(false);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleChangePage = (event, newPage) => {
        dispatch(pageChange(newPage));
    };

    return (
        <div className='facility-reports outlined-container'>
            <header>
                <h1 className='title'>Facility Reports</h1>
            </header>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Create Time</TableCell>
                            <TableCell>Reporter</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {facilityReports?.length ? (
                            facilityReports.map((row) => (
                                <TableRow key={row._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell component='th' scope='row'>
                                        {row.title}
                                    </TableCell>
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell>{row.createdAt}</TableCell>
                                    <TableCell>{`${row?.createdBy?.preferredName || row?.createdBy?.firstName} ${
                                        row?.createdBy?.lastName
                                    }`}</TableCell>
                                    <TableCell>
                                        <Button variant='outlined' onClick={() => handleCommentButtonClick(row._id)}>
                                            Comment
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow sx={{ textAlign: 'center' }}>
                                <TableCell colSpan={5} align='center'>
                                    No data found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <div className='flex justify-center p-1'>
                <Pagination count={totalPages} color='primary' onChange={handleChangePage} />
            </div>
            {parent === 'employee' && (
                <>
                    <Button variant='contained' sx={{ display: 'block', mt: '1rem' }} onClick={() => setOpen(true)}>
                        Request New Report
                    </Button>
                    <NewReportForm
                        handleClose={handleClose}
                        open={open}
                        handleSubmit={handleSubmit}
                        formData={formData}
                        setFormData={setFormData}
                    />
                </>
            )}
            {/* Chatbox Drawer */}
            {selectedReport && (
                <ChatBox
                    report={selectedReport}
                    open={chatboxOpen}
                    onClose={() => setChatboxOpen(false)}
                    comments={selectedReport?.comments || []}
                    onAddComment={handleAddComment}
                />
            )}
        </div>
    );
};

const NewReportForm = ({ handleClose, open, handleSubmit, formData, setFormData }) => {
    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle sx={{ m: 0, p: 2 }}>Request Newq Facility Report</DialogTitle>
            <IconButton
                aria-label='close'
                onClick={handleClose}
                sx={(theme) => ({
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
            >
                <CloseIcon />
            </IconButton>
            <DialogContent dividers sx={{ width: '30vw' }}>
                <form className='input-container flex-col g-1'>
                    <TextField
                        sx={{ width: '100%' }}
                        required
                        label='Title'
                        value={formData.title}
                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    />
                    <TextField
                        required
                        label='Description'
                        sx={{ width: '100%' }}
                        multiline
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    />
                </form>
            </DialogContent>
            <DialogActions>
                <Button color='error' onClick={handleClose}>Cancel</Button>
                <Button type='submit' autoFocus onClick={handleSubmit}>
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};
export default HousingView;
