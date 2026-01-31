package com.easytimeoff.web;

import com.easytimeoff.domain.LeaveRecord;
import com.easytimeoff.domain.User;

import java.util.List;

public record UserLeavesResponse(User user, List<LeaveRecord> leaves) {}
